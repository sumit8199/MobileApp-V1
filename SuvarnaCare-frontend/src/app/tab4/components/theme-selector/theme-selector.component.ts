import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  sunnyOutline,
  sunny,
  moonOutline,
  moon,
  phonePortraitOutline,
  colorPaletteOutline,
  checkmarkCircle,
  sparklesOutline,
} from 'ionicons/icons';
import { ThemeService, ThemeMode } from '@core/services';

interface ThemeOption {
  id: ThemeMode;
  name: string;
  description: string;
  icon: string;
  activeIcon: string;
}

@Component({
  selector: 'app-theme-selector',
  templateUrl: './theme-selector.component.html',
  styleUrls: ['./theme-selector.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon],
})
export class ThemeSelectorComponent {
  public themeService = inject(ThemeService);

  public readonly themeOptions: ThemeOption[] = [
    {
      id: 'system',
      name: 'System',
      description: 'Auto match OS',
      icon: 'phone-portrait-outline',
      activeIcon: 'phone-portrait-outline',
    },
    {
      id: 'light',
      name: 'Light',
      description: 'Crisp Emerald',
      icon: 'sunny-outline',
      activeIcon: 'sunny',
    },
    {
      id: 'dark',
      name: 'Dark',
      description: 'Night Emerald',
      icon: 'moon-outline',
      activeIcon: 'moon',
    },
  ];

  constructor() {
    addIcons({
      sunnyOutline,
      sunny,
      moonOutline,
      moon,
      phonePortraitOutline,
      colorPaletteOutline,
      checkmarkCircle,
      sparklesOutline,
    });
  }

  public selectTheme(mode: ThemeMode): void {
    this.themeService.setTheme(mode);
  }
}
