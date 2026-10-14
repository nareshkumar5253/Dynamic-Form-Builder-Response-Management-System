
import api from "./axios";

export interface AnalyticsSummary {
  total_forms: number;
  enabled_forms: number;
  disabled_forms: number;
  total_responses: number;
  submitted_responses: number;
  updated_responses: number;
}

export interface FormStatistic {
  form_id: number;
  title: string;
  is_enabled: boolean;
  response_count: number;
}

export interface SubmissionTrend {
  date: string;
  count: number;
}

export interface RecentSubmission {
  response_id: number;
  form_id: number;
  form_title: string;
  submitted_by: string;
  status: string;
  submitted_at: string;
}

export interface DashboardAnalytics {
  summary: AnalyticsSummary;
  forms: FormStatistic[];
  submission_trend: SubmissionTrend[];
  recent_submissions: RecentSubmission[];
}

export interface StatusBreakdown {
  status: string;
  count: number;
}

export interface AnswerDistribution {
  value: string;
  count: number;
}

export interface FieldAnalytics {
  field_id: number;
  field_name: string;
  field_label: string;
  field_type: string;
  answer_count: number;
  answer_distribution: AnswerDistribution[];
}

export interface FormAnalytics {
  form_id: number;
  form_title: string;
  total_responses: number;
  status_breakdown: StatusBreakdown[];
  submission_trend: SubmissionTrend[];
  field_analytics: FieldAnalytics[];
}

export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  const response = await api.get<DashboardAnalytics>(
    "/dashboard/analytics"
  );

  return response.data;
}

export async function getFormAnalytics(
  formId: number,
  days = 7
): Promise<FormAnalytics> {
  const response = await api.get<FormAnalytics>(
    `/dashboard/forms/${formId}/analytics`,
    { params: { days } }
  );

  return response.data;
}
