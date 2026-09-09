import { Injectable, signal, computed } from '@angular/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export type ThemeMode = 'system' | 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'suvarnacare_theme_mode';
  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  // Selected mode: 'system' | 'light' | 'dark'
  public themeMode = signal<ThemeMode>(this.getInitialThemeMode());

  // Actual active theme resolved
  public isDark = signal<boolean>(this.calculateIsDark(this.themeMode()));

  // Active theme label
  public currentActiveLabel = computed(() => {
    const mode = this.themeMode();
    if (mode === 'system') {
      return this.isDark() ? 'System (Dark)' : 'System (Light)';
    }
    return mode === 'dark' ? 'Dark Mode' : 'Light Mode';
  });

  constructor() {
    // Apply initial theme immediately
    this.applyTheme(this.themeMode());

    // Listen to OS dark/light mode changes when mode is 'system'
    this.mediaQuery.addEventListener('change', (e) => {
      if (this.themeMode() === 'system') {
        const dark = e.matches;
        this.isDark.set(dark);
        this.updateDomAndStatusBar(dark);
      }
    });
  }

  /**
   * Set theme mode preference
   */
  public setTheme(mode: ThemeMode): void {
    this.themeMode.set(mode);
    try {
      localStorage.setItem(this.STORAGE_KEY, mode);
    } catch (e) {
      console.warn('Could not save theme preference to localStorage', e);
    }
    this.applyTheme(mode);
  }

  /**
   * Reads initial mode from localStorage or defaults to 'system'
   */
  private getInitialThemeMode(): ThemeMode {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY) as ThemeMode | null;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch (e) {
      console.warn('Could not read theme preference from localStorage', e);
    }
    return 'system';
  }

  /**
   * Calculates whether the resolved theme is dark
   */
  private calculateIsDark(mode: ThemeMode): boolean {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return this.mediaQuery.matches;
  }

  /**
   * Applies the theme to DOM classes and device status bar
   */
  private applyTheme(mode: ThemeMode): void {
    const dark = this.calculateIsDark(mode);
    this.isDark.set(dark);
    this.updateDomAndStatusBar(dark);
  }

  /**
   * Updates DOM attributes and native status bar
   */
  private updateDomAndStatusBar(isDark: boolean): void {
    // 1. Ionic 8 Palette Dark class on <html> and <body>
    document.documentElement.classList.toggle('ion-palette-dark', isDark);
    document.body.classList.toggle('ion-palette-dark', isDark);

    // 2. Data theme attribute for custom SCSS styling
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

    // 3. Status bar styling if running on native Capacitor app
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({
        style: isDark ? Style.Dark : Style.Light,
      }).catch(() => {});

      StatusBar.setBackgroundColor({
        color: isDark ? '#112e1c' : '#1a4329',
      }).catch(() => {});
    }
  }
}
