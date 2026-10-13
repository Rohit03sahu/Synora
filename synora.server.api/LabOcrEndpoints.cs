using System.IO;
using Microsoft.AspNetCore.Mvc;
using Synora.Server.Infrastructure.Ocr;

namespace Synora.Server.Api;

public static class LabOcrEndpoints
{
    private const long MaxFileSize = 10 * 1024 * 1024;

    public static RouteGroupBuilder MapLabOcrEndpoints(this RouteGroupBuilder api)
    {
        api.MapPost("/labs/ocr", async (
            HttpRequest request,
            FoundryOcrService ocrService,
            ILogger<FoundryOcrService> logger,
            CancellationToken cancellationToken) =>
        {
            if (!request.HasFormContentType)
            {
                return Results.Problem(
                    title: "An image file is required",
                    detail: "Upload a PNG, JPEG, or WebP lab report image.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            if (request.ContentLength > MaxFileSize + 1024 * 1024)
            {
                return Results.Problem(
                    title: "Image is too large",
                    detail: "Choose an image smaller than 10 MB.",
                    statusCode: StatusCodes.Status413PayloadTooLarge);
            }

            IFormCollection form;
            try
            {
                form = await request.ReadFormAsync(cancellationToken);
            }
            catch (InvalidDataException exception)
            {
                logger.LogWarning(exception, "Rejected an invalid lab report upload.");
                return Results.Problem(
                    title: "Invalid upload",
                    detail: "The uploaded form could not be read.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var file = form.Files.GetFile("file");
            if (file is null || file.Length == 0)
            {
                return Results.Problem(
                    title: "An image file is required",
                    detail: "Choose a PNG, JPEG, or WebP lab report image.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            if (file.Length > MaxFileSize)
            {
                return Results.Problem(
                    title: "Image is too large",
                    detail: "Choose an image smaller than 10 MB.",
                    statusCode: StatusCodes.Status413PayloadTooLarge);
            }

            var mediaType = file.ContentType.ToLowerInvariant();
            if (mediaType is not ("image/png" or "image/jpeg" or "image/webp"))
            {
                return Results.Problem(
                    title: "Unsupported image format",
                    detail: "Upload a PNG, JPEG, or WebP lab report image.",
                    statusCode: StatusCodes.Status415UnsupportedMediaType);
            }

            await using var stream = file.OpenReadStream();
            using var image = new MemoryStream();
            await stream.CopyToAsync(image, cancellationToken);
            if (!HasMatchingImageSignature(image.GetBuffer(), (int)image.Length, mediaType))
            {
                return Results.Problem(
                    title: "Invalid image file",
                    detail: "The uploaded file does not match its image format.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            if (!ocrService.IsConfigured)
            {
                return Results.Problem(
                    title: "OCR is not configured",
                    detail: "The server administrator must configure the Azure AI Foundry OCR deployment.",
                    statusCode: StatusCodes.Status503ServiceUnavailable);
            }

            try
            {
                var results = await ocrService.ExtractAsync(
                    image.ToArray(),
                    mediaType,
                    cancellationToken);
                return Results.Ok(results);
            }
            catch (FoundryOcrException exception)
            {
                logger.LogError(exception, "Azure AI Foundry OCR request failed.");
                return Results.Problem(
                    title: "Could not read the lab report",
                    detail: "The OCR service could not process this image. Try again or enter results manually.",
                    statusCode: StatusCodes.Status502BadGateway);
            }
            catch (TaskCanceledException exception) when (!cancellationToken.IsCancellationRequested)
            {
                logger.LogError(exception, "Azure AI Foundry OCR request timed out.");
                return Results.Problem(
                    title: "OCR request timed out",
                    detail: "The OCR service took too long to respond. Try again.",
                    statusCode: StatusCodes.Status504GatewayTimeout);
            }
        })
        .WithMetadata(new RequestSizeLimitAttribute(MaxFileSize + 1024 * 1024));

        return api;
    }

    private static bool HasMatchingImageSignature(byte[] image, int length, string mediaType)
    {
        return mediaType switch
        {
            "image/png" => length >= 8 &&
                image.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }),
            "image/jpeg" => length >= 3 &&
                image[0] == 255 && image[1] == 216 && image[2] == 255,
            "image/webp" => length >= 12 &&
                image.AsSpan(0, 4).SequenceEqual("RIFF"u8) &&
                image.AsSpan(8, 4).SequenceEqual("WEBP"u8),
            _ => false,
        };
    }
}
