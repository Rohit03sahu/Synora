export type UserRole = 'patient' | 'doctor' | 'hospital' | 'wellness';

export type RiskLevel = 'lower' | 'moderate' | 'elevated';

export type ExplanationLevel = 'simple' | 'detailed' | 'clinical';

export interface NavItem {
  label: string;
  href: string;
}

export interface SignalCard {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface DiabetesType {
  name: string;
  description: string;
  riskFactors: string[];
  indicators: string[];
  assessment: string;
  earlyAwareness: string;
}

export interface RiskFactor {
  category: string;
  factors: { name: string; description: string }[];
}

export interface LabResult {
  id?: string;
  parameter: string;
  result: string;
  unit: string;
  reference: string;
  date: string;
  status: 'normal' | 'borderline' | 'high' | 'low';
}

export interface CGMMetric {
  label: string;
  value: string;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
}

export interface ContributionFactor {
  name: string;
  contribution: number;
  value: string;
  trend: 'up' | 'down' | 'stable';
  explanation: string;
  dataSource: string;
}

export interface CrossSignalInsight {
  title: string;
  signals: string[];
  result: string;
  description: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number | null;
  lastAssessment: string | null;
  dataAvailable: string;
  assessment: RiskLevel | null;
  lastUpdated: string | null;
}

export interface DashboardOverview {
  stats: {
    totalPatients: number;
    assessedPatients: number;
    pendingAssessments: number;
    dataCompleteness: number;
    cgmAdoption: number;
    members: number;
    assessments: number;
    completedSurveys: number;
    healthTrend: number;
  };
  riskDistribution: { name: string; value: number }[];
  assessmentTrends: { month: string; assessed: number }[];
  hba1cDistribution: { range: string; patients: number }[];
  patients: Patient[];
}
