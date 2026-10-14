
import api from "./axios";

export interface ActivityLog {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  description: string | null;
  log_metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ActivityLogsResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  logs: ActivityLog[];
}

export interface ActivityLogFilters {
  action?: string;
  entity_type?: string;
  user_id?: number;
  page?: number;
  page_size?: number;
}

export async function getActivityLogs(
  filters: ActivityLogFilters = {}
): Promise<ActivityLogsResponse> {
  const response = await api.get<ActivityLogsResponse>(
    "/activity-logs",
    {
      params: filters,
    }
  );

  return response.data;
}
