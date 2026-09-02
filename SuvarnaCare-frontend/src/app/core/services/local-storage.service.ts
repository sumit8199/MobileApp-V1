import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  private memoryFallback: Map<string, string> = new Map();

  /**
   * Check if window.localStorage is available
   */
  private isStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Store value by key
   */
  setItem<T>(key: string, value: T): boolean {
    try {
      const serialized = JSON.stringify(value);
      if (this.isStorageAvailable()) {
        window.localStorage.setItem(key, serialized);
      } else {
        this.memoryFallback.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error(`[LocalStorageService] Error setting key: ${key}`, error);
      return false;
    }
  }

  /**
   * Get value by key with optional fallback default
   */
  getItem<T>(key: string, defaultValue?: T): T | null {
    try {
      let raw: string | null = null;
      if (this.isStorageAvailable()) {
        raw = window.localStorage.getItem(key);
      } else {
        raw = this.memoryFallback.get(key) ?? null;
      }

      if (raw === null || raw === undefined) {
        return defaultValue !== undefined ? defaultValue : null;
      }

      return JSON.parse(raw) as T;
    } catch (error) {
      console.error(`[LocalStorageService] Error getting key: ${key}`, error);
      return defaultValue !== undefined ? defaultValue : null;
    }
  }

  /**
   * Remove item by key
   */
  removeItem(key: string): boolean {
    try {
      if (this.isStorageAvailable()) {
        window.localStorage.removeItem(key);
      }
      this.memoryFallback.delete(key);
      return true;
    } catch (error) {
      console.error(`[LocalStorageService] Error removing key: ${key}`, error);
      return false;
    }
  }

  /**
   * Clear all storage or clear items matching prefix
   */
  clear(prefix?: string): void {
    try {
      if (this.isStorageAvailable()) {
        if (!prefix) {
          window.localStorage.clear();
        } else {
          const keysToRemove: string[] = [];
          for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            if (key && key.startsWith(prefix)) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((k) => window.localStorage.removeItem(k));
        }
      }

      if (!prefix) {
        this.memoryFallback.clear();
      } else {
        Array.from(this.memoryFallback.keys())
          .filter((k) => k.startsWith(prefix))
          .forEach((k) => this.memoryFallback.delete(k));
      }
    } catch (error) {
      console.error('[LocalStorageService] Error clearing storage', error);
    }
  }
}
