
import api from "./axios";

export interface FormItem {
  id: number;
  title: string;
  description: string | null;
  created_by: number;
  is_public: boolean;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormCreate {
  title: string;
  description: string | null;
  is_public: boolean;
}

export interface FormUpdate {
  title?: string;
  description?: string | null;
  is_public?: boolean;
  is_enabled?: boolean;
}

export async function getForms(): Promise<FormItem[]> {
  const response = await api.get<FormItem[]>("/forms");
  return response.data;
}

export async function createForm(
  formData: FormCreate,
): Promise<FormItem> {
  const response = await api.post<FormItem>("/forms", formData);
  return response.data;
}

export async function updateForm(
  formId: number,
  formData: FormUpdate,
): Promise<FormItem> {
  const response = await api.put<FormItem>(
    `/forms/${formId}`,
    formData,
  );
  return response.data;
}

export async function enableForm(formId: number): Promise<FormItem> {
  const response = await api.patch<FormItem>(
    `/forms/${formId}/enable`,
  );
  return response.data;
}

export async function disableForm(formId: number): Promise<FormItem> {
  const response = await api.patch<FormItem>(
    `/forms/${formId}/disable`,
  );
  return response.data;
}

export async function deleteForm(formId: number): Promise<void> {
  await api.delete(`/forms/${formId}`);
}
