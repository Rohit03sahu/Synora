export const enabledFeatures = {
  hospitals: process.env.NEXT_PUBLIC_FEATURE_HOSPITALS_ENABLED === 'true',
  wellness: process.env.NEXT_PUBLIC_FEATURE_WELLNESS_ENABLED === 'true',
} as const;
