import { apiClient } from './apiClient';

export const backupApi = {
  exportBackup: () => apiClient<any>('/api/backup/export'),
  exportMysqlDump: () => apiClient<any>('/api/backup/export-mysql'),
  restoreBackup: (data: any) =>
    apiClient<any>('/api/backup/restore', { method: 'POST', body: data }),
  restoreMysqlDump: (sqlText: string) =>
    apiClient<any>('/api/backup/restore-mysql', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: sqlText,
    }),
};
