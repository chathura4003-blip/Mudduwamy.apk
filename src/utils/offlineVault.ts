/**
 * Offline Document & Material Vault
 * Manages caching and offline access to study materials, PDFs, notes, and timetable data.
 */

export interface CachedVaultItem {
  id: string;
  title: string;
  category: string;
  fileUrl: string;
  dataUrl?: string;
  savedAt: number;
  sizeBytes?: number;
  subjectName?: string;
}

const VAULT_STORAGE_KEY = 'pirivena_offline_vault_items';

export const offlineVault = {
  /**
   * Get all items saved in offline vault
   */
  getItems(): CachedVaultItem[] {
    try {
      const data = localStorage.getItem(VAULT_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Check if a specific document/material is saved offline
   */
  isSaved(id: string): boolean {
    const items = this.getItems();
    return items.some((i) => i.id === id);
  },

  /**
   * Save an item into the offline vault
   */
  saveItem(item: CachedVaultItem): boolean {
    try {
      const items = this.getItems().filter((i) => i.id !== item.id);
      items.unshift({ ...item, savedAt: Date.now() });
      // Keep up to 50 items
      if (items.length > 50) items.pop();
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('offline-vault-updated'));
      return true;
    } catch (e) {
      console.warn('Failed to save to offline vault:', e);
      return false;
    }
  },

  /**
   * Remove an item from the offline vault
   */
  removeItem(id: string): boolean {
    try {
      const items = this.getItems().filter((i) => i.id !== id);
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('offline-vault-updated'));
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Clear all offline vault items
   */
  clearAll(): boolean {
    try {
      localStorage.removeItem(VAULT_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('offline-vault-updated'));
      return true;
    } catch {
      return false;
    }
  },
};
