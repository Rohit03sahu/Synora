import { readdir, readFile } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

globalThis.CustomEvent ??= class CustomEvent extends Event {
  constructor(type, options = {}) {
    super(type, options);
    this.detail = options.detail;
  }
};

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "../..");
const migrationsDirectory = resolve(
  repositoryRoot,
  "synora.server.infrastructure/Database/Migrations",
);
const migrationFiles = (await readdir(migrationsDirectory))
  .filter((file) => /^\d+_.+\.sql$/.test(file))
  .sort();

const database = await PGlite.create();
const databaseServer = new PGLiteSocketServer({
  db: database,
  host: "127.0.0.1",
  port: 5432,
  maxConnections: 10,
});
const children = [];
let shuttingDown = false;
let shutdownPromise;

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return shutdownPromise;
  }
  shuttingDown = true;
  shutdownPromise = (async () => {
    for (const child of children) {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill("SIGTERM");
      }
    }
    await Promise.all(
      children.map(
        (child) =>
          new Promise((resolveExit) => {
            if (child.exitCode !== null || child.signalCode !== null) {
              resolveExit();
            } else {
              child.once("exit", resolveExit);
              setTimeout(() => {
                child.kill("SIGKILL");
                resolveExit();
              }, 5000).unref();
            }
          }),
      ),
    );
    await databaseServer.stop().catch(() => {});
    await database.close();
    process.exitCode = exitCode;
  })();
  return shutdownPromise;
}

function start(command, args, options) {
  const child = spawn(command, args, { stdio: "inherit", ...options });
  children.push(child);
  child.once("error", (error) => {
    console.error(`Failed to start ${command}: ${error.message}`);
    void shutdown(1);
  });
  child.once("exit", (code, signal) => {
    if (!shuttingDown) {
      console.error(`${command} stopped unexpectedly (${signal ?? `exit ${code}`}).`);
      void shutdown(code ?? 1);
    }
  });
  return child;
}

function findDotnet() {
  const candidates = [process.env.DOTNET, "dotnet", resolve(process.env.HOME ?? "", ".dotnet/dotnet")]
    .filter(Boolean);
  for (const candidate of candidates) {
    const result = spawnSync(candidate, ["--list-sdks"], { encoding: "utf8" });
    if (result.status === 0 && /^10\./m.test(result.stdout)) {
      return candidate;
    }
  }
  throw new Error(".NET 10 SDK is required to run the API.");
}

async function waitForService(url, name, childrenAlive) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (!childrenAlive()) {
      throw new Error(`${name} process exited before becoming ready.`);
    }
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (response.ok) {
        console.log(`${name} is ready at ${url}`);
        return;
      }
    } catch {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 1000));
    }
  }
  if (childrenAlive()) {
    throw new Error(`${name} did not become ready at ${url} within 120 seconds.`);
  }
}

try {
  for (const migrationFile of migrationFiles) {
    const migration = await readFile(resolve(migrationsDirectory, migrationFile), "utf8");
    await database.exec(migration);
    console.log(`Applied ${migrationFile}`);
  }

  await databaseServer.start();
  console.log("In-memory PostgreSQL is ready at 127.0.0.1:5432.");

  const dotnet = findDotnet();
  const apiDirectory = resolve(repositoryRoot, "synora.server.api");
  const clientDirectory = resolve(repositoryRoot, "synora.client");
  const nextCli = resolve(clientDirectory, "node_modules/next/dist/bin/next");
  const api = start(
    dotnet,
    ["run", "--no-launch-profile", "--project", "Synora.Server.Api.csproj"],
    {
      cwd: apiDirectory,
      env: {
        ...process.env,
        ASPNETCORE_ENVIRONMENT: "Development",
        ASPNETCORE_URLS: "http://localhost:5247",
        Authentication__RequireEmailVerification:
          process.env.REQUIRE_EMAIL_VERIFICATION ?? "false",
        ConnectionStrings__Postgres:
          "Host=127.0.0.1;Port=5432;Database=postgres;Username=postgres;Password=postgres;SslMode=Disable",
      },
    },
  );
  const client = start(
    process.execPath,
    [nextCli, "dev", "--hostname", "0.0.0.0"],
    {
      cwd: clientDirectory,
      env: {
        ...process.env,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5247",
      },
    },
  );

  console.log("Press Ctrl+C to stop Synora. The database is in-memory; all data is discarded on exit.");
  const childrenAlive = () =>
    [api, client].every((child) => child.exitCode === null && child.signalCode === null);
  await Promise.all([
    waitForService("http://127.0.0.1:5247/health", "API and database", childrenAlive),
    waitForService("http://127.0.0.1:3000", "Client", childrenAlive),
  ]);

  await new Promise((resolveStop) => {
    process.once("SIGINT", resolveStop);
    process.once("SIGTERM", resolveStop);
    for (const child of [api, client]) {
      child.once("exit", resolveStop);
    }
  });
  await shutdown();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  await shutdown(1);
}
