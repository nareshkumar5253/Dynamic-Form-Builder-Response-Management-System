
import api from "./axios";

export type FieldType =
  | "TEXT"
  | "NUMBER"
  | "EMAIL"
  | "DATE"
  | "DROPDOWN"
  | "CHECKBOX"
  | "RADIO"
  | "FILE"
  | "RATING";

export interface FormFieldItem {
  id: number;
  form_id: number;
  field_name: string;
  field_label: string;
  field_type: FieldType;
  placeholder: string | null;
  help_text: string | null;
  is_required: boolean;
  field_order: number;
  validation_rules: Record<string, unknown> | null;
  conditional_logic: Record<string, unknown> | null;
}

export interface FormFieldPayload {
  field_name: string;
  field_label: string;
  field_type: FieldType;
  placeholder: string | null;
  help_text: string | null;
  is_required: boolean;
  field_order: number;
  validation_rules?: Record<string, unknown> | null;
  conditional_logic?: Record<string, unknown> | null;
}

export async function getFormFields(
  formId: number,
): Promise<FormFieldItem[]> {
  const response = await api.get<FormFieldItem[]>(
    `/forms/${formId}/fields`,
  );
  return response.data;
}

export async function createFormField(
  formId: number,
  payload: FormFieldPayload,
): Promise<FormFieldItem> {
  const response = await api.post<FormFieldItem>(
    `/forms/${formId}/fields`,
    payload,
  );
  return response.data;
}

export async function updateFormField(
  formId: number,
  fieldId: number,
  payload: Partial<FormFieldPayload>,
): Promise<FormFieldItem> {
  const response = await api.put<FormFieldItem>(
    `/forms/${formId}/fields/${fieldId}`,
    payload,
  );
  return response.data;
}

export async function deleteFormField(
  formId: number,
  fieldId: number,
): Promise<void> {
  await api.delete(`/forms/${formId}/fields/${fieldId}`);
}
