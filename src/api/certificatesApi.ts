import { apiClient } from './apiClient';

export const certificatesApi = {
  verifyCertificate: (id: string) =>
    apiClient<any>(`/api/certificates/verify/${encodeURIComponent(id)}`),
};
