import { LabResult, CGMMetric, ContributionFactor, CrossSignalInsight, Patient } from './types';

export const mockLabResults: LabResult[] = [
  { parameter: 'HbA1c', result: '5.8', unit: '%', reference: '< 5.7%', date: '2026-09-15', status: 'borderline' },
  { parameter: 'Fasting Glucose', result: '102', unit: 'mg/dL', reference: '70-99', date: '2026-09-15', status: 'borderline' },
  { parameter: 'Post-meal Glucose', result: '145', unit: 'mg/dL', reference: '< 140', date: '2026-09-15', status: 'borderline' },
  { parameter: 'Total Cholesterol', result: '185', unit: 'mg/dL', reference: '< 200', date: '2026-09-15', status: 'normal' },
  { parameter: 'HDL', result: '42', unit: 'mg/dL', reference: '> 40', date: '2026-09-15', status: 'normal' },
  { parameter: 'LDL', result: '115', unit: 'mg/dL', reference: '< 100', date: '2026-09-15', status: 'borderline' },
  { parameter: 'Triglycerides', result: '140', unit: 'mg/dL', reference: '< 150', date: '2026-09-15', status: 'normal' },
  { parameter: 'Creatinine', result: '0.9', unit: 'mg/dL', reference: '0.6-1.2', date: '2026-09-15', status: 'normal' },
  { parameter: 'eGFR', result: '98', unit: 'mL/min', reference: '> 90', date: '2026-09-15', status: 'normal' },
];

export const mockCGMMetrics: CGMMetric[] = [
  { label: 'Average Glucose', value: '128', unit: 'mg/dL', trend: 'stable', status: 'warning' },
  { label: 'Time in Range', value: '72', unit: '%', trend: 'up', status: 'good' },
  { label: 'Time Above Range', value: '24', unit: '%', trend: 'down', status: 'warning' },
  { label: 'Time Below Range', value: '4', unit: '%', trend: 'stable', status: 'good' },
  { label: 'Glucose Variability', value: '38', unit: '%', trend: 'down', status: 'warning' },
  { label: 'GMI', value: '5.9', unit: '%', trend: 'stable', status: 'warning' },
];

export const mockGlucoseTrendData = Array.from({ length: 14 }, (_, i) => {
  const base = 120 + Math.sin(i * 0.5) * 30 + Math.random() * 20;
  return {
    day: `Day ${i + 1}`,
    average: Math.round(base),
    low: Math.round(base - 40),
    high: Math.round(base + 50),
  };
});

export const mockTimeInRange = [
  { name: 'In Range (70-180)', value: 72, color: 'hsl(var(--chart-4))' },
  { name: 'Above Range (>180)', value: 24, color: 'hsl(var(--chart-3))' },
  { name: 'Below Range (<70)', value: 4, color: 'hsl(var(--chart-5))' },
];

export const mockDailyPattern = Array.from({ length: 24 }, (_, h) => {
  const base = 110 + Math.sin((h - 6) * 0.3) * 35 + (h > 6 && h < 9 ? 40 : 0) + (h > 12 && h < 14 ? 35 : 0) + (h > 18 && h < 20 ? 30 : 0);
  return { hour: `${h}:00`, glucose: Math.round(base) };
});

export const mockGlucoseVariability = Array.from({ length: 14 }, (_, i) => ({
  day: `Day ${i + 1}`,
  cv: Math.round(30 + Math.random() * 15),
}));

export const mockContributionFactors: ContributionFactor[] = [
  { name: 'HbA1c', contribution: 85, value: '5.8%', trend: 'up', explanation: 'Your recent HbA1c is in the prediabetes range (5.7%-6.4%), which is one of the primary clinical signals.', dataSource: 'Laboratory' },
  { name: 'BMI', contribution: 70, value: '27.5', trend: 'up', explanation: 'A BMI of 27.5 is in the overweight range, which contributes to insulin resistance risk.', dataSource: 'Profile' },
  { name: 'Family History', contribution: 60, value: 'Father, Grandparent', trend: 'stable', explanation: 'Immediate family history of Type 2 diabetes increases genetic risk component.', dataSource: 'Profile' },
  { name: 'Glucose Variability', contribution: 50, value: '38% CV', trend: 'down', explanation: 'Glucose variability above 36% indicates fluctuating glucose levels from CGM data.', dataSource: 'CGM' },
  { name: 'Physical Activity', contribution: 35, value: '2x/week', trend: 'stable', explanation: 'Below recommended activity levels for metabolic health maintenance.', dataSource: 'Lifestyle' },
];

export const mockCrossSignalInsights: CrossSignalInsight[] = [
  {
    title: 'Post-meal Glucose Response',
    signals: ['CGM', 'Meal Information', 'Activity', 'Insulin'],
    result: 'Elevated post-meal spikes detected after high-carb meals',
    description: 'Your CGM data shows glucose spikes above 180 mg/dL following carbohydrate-heavy meals, particularly at lunch. Activity levels on these days were below average, and no insulin corrections were logged.',
  },
  {
    title: 'Combined Genetic & Clinical Risk',
    signals: ['Family History', 'Genomic Information', 'Clinical Measurements'],
    result: 'Polygenic risk score aligns with borderline clinical markers',
    description: 'Your family history and polygenic risk score show a genetic predisposition that, combined with your borderline HbA1c and fasting glucose, suggests elevated risk that warrants monitoring.',
  },
  {
    title: 'Sleep & Glucose Pattern',
    signals: ['Sleep Tracker', 'CGM', 'Lifestyle'],
    result: 'Poor sleep nights correlate with higher fasting glucose',
    description: 'On nights with less than 6 hours of sleep, your fasting glucose averaged 15 mg/dL higher the following morning compared to nights with 7+ hours of sleep.',
  },
];

export const mockPatients: Patient[] = [
  { id: 'p1', name: 'Sarah Johnson', age: 54, lastAssessment: '2026-09-20', dataAvailable: 'Lab, CGM, Lifestyle', assessment: 'elevated', lastUpdated: '2 days ago' },
  { id: 'p2', name: 'Michael Chen', age: 42, lastAssessment: '2026-09-18', dataAvailable: 'Lab, Genomics', assessment: 'moderate', lastUpdated: '4 days ago' },
  { id: 'p3', name: 'Emily Davis', age: 38, lastAssessment: '2026-09-22', dataAvailable: 'Lab, CGM, Genomics, Lifestyle', assessment: 'lower', lastUpdated: '1 day ago' },
  { id: 'p4', name: 'Robert Wilson', age: 61, lastAssessment: '2026-09-10', dataAvailable: 'Lab, CGM, Insulin', assessment: 'elevated', lastUpdated: '1 week ago' },
  { id: 'p5', name: 'Linda Martinez', age: 47, lastAssessment: '2026-09-19', dataAvailable: 'Lab, Lifestyle', assessment: 'moderate', lastUpdated: '5 days ago' },
  { id: 'p6', name: 'James Anderson', age: 35, lastAssessment: '2026-09-21', dataAvailable: 'Lab, CGM, Genomics', assessment: 'lower', lastUpdated: '3 days ago' },
];

export const mockHospitalStats = {
  totalPatients: 1247,
  assessedPatients: 892,
  pendingAssessments: 355,
  dataCompleteness: 78,
  cgmAdoption: 43,
};

export const mockRiskDistribution = [
  { name: 'Lower', value: 412, color: 'hsl(var(--chart-4))' },
  { name: 'Moderate', value: 298, color: 'hsl(var(--chart-3))' },
  { name: 'Elevated', value: 182, color: 'hsl(var(--chart-5))' },
];

export const mockHbA1cDistribution = Array.from({ length: 10 }, (_, i) => ({
  range: `${5 + i * 0.3}-${5.3 + i * 0.3}`,
  patients: Math.round(Math.random() * 200 + 50),
}));

export const mockAssessmentTrends = Array.from({ length: 6 }, (_, i) => ({
  month: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'][i],
  assessed: Math.round(120 + i * 30 + Math.random() * 20),
  pending: Math.round(80 - i * 5 + Math.random() * 15),
}));

export const mockWellnessStats = {
  members: 856,
  assessments: 423,
  completedSurveys: 678,
  healthTrend: 12,
};
