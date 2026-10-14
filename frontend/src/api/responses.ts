
import api from "./axios";

export interface ResponseDetail {
  id: number;
  response_id: number;
  field_id: number;
  value: unknown;
  created_at: string;
  updated_at: string;
}

export interface FormResponseItem {
  id: number;
  form_id: number;
  submitted_by: number | null;
  status: string;
  submitted_at: string;
  updated_at: string;
  details: ResponseDetail[];
}

export interface ResponseHistoryItem {
  id: number;
  response_id: number;
  field_id: number;
  changed_by: number | null;
  old_value: unknown;
  new_value: unknown;
  action: string;
  changed_at: string;
}

export interface ResponseListResult {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  responses: FormResponseItem[];
}

export interface ResponseFilters {
  page?: number;
  page_size?: number;
  status_filter?: string;
  submitted_by?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface ResponseValueInput {
  field_id: number;
  value: unknown;
}

export interface ResponsePayload {
  responses: ResponseValueInput[];
}

/**
 * List responses for one form.
 */
export async function getFormResponses(
  formId: number,
  filters: ResponseFilters = {}
): Promise<ResponseListResult> {
  const response = await api.get<ResponseListResult>(
    `/forms/${formId}/responses`,
    { params: filters }
  );

  return response.data;
}

/**
 * Get one response and its field values.
 */
export async function getFormResponse(
  formId: number,
  responseId: number
): Promise<FormResponseItem> {
  const response = await api.get<FormResponseItem>(
    `/forms/${formId}/responses/${responseId}`
  );

  return response.data;
}

/**
 * Submit a response.
 */
export async function submitFormResponse(
  formId: number,
  payload: ResponsePayload
): Promise<FormResponseItem> {
  const response = await api.post<FormResponseItem>(
    `/forms/${formId}/responses`,
    payload
  );

  return response.data;
}

/**
 * Update an existing response.
 */
export async function updateFormResponse(
  formId: number,
  responseId: number,
  payload: ResponsePayload
): Promise<FormResponseItem> {
  const response = await api.put<FormResponseItem>(
    `/forms/${formId}/responses/${responseId}`,
    payload
  );

  return response.data;
}

/**
 * Get the change history for a response.
 */
export async function getResponseHistory(
  formId: number,
  responseId: number
): Promise<ResponseHistoryItem[]> {
  const response = await api.get<ResponseHistoryItem[]>(
    `/forms/${formId}/responses/${responseId}/history`
  );

  return response.data;
}
