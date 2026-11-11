import apiClient from "@/services/api-client";

export type RegistrationFieldType =
  | "gender"
  | "date"
  | "address"
  | "text"
  | "textarea"
  | "select";

export type RegistrationFieldOption = {
  value: string;
  label: string;
};

export type RegistrationField = {
  id?: number;
  key: string;
  label: string;
  field_type: RegistrationFieldType;
  is_system: boolean;
  visible: boolean;
  required: boolean;
  sequence: number;
  active?: boolean;
  options: RegistrationFieldOption[];
};

export type RegistrationFormResponse = {
  configured: boolean;
  fields: RegistrationField[];
};

export type UpdateRegistrationFormRequest = {
  fields: Array<{
    key: string;
    label: string;
    field_type: RegistrationFieldType;
    visible: boolean;
    required: boolean;
    sequence: number;
    options?: RegistrationFieldOption[];
  }>;
};

export const getRegistrationFields = async () => {
  const res = await apiClient.client.get<RegistrationFormResponse>(
    "/portal/registration-fields",
  );
  return res.data;
};

export const updateRegistrationFields = async (
  payload: UpdateRegistrationFormRequest,
) => {
  const res = await apiClient.client.put<RegistrationFormResponse>(
    "/portal/registration-fields",
    payload,
  );
  return res.data;
};
