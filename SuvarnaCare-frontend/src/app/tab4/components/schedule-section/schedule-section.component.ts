import { Component, computed, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  calendarOutline,
  checkmarkOutline,
  chevronDownOutline,
  chevronForwardOutline,
  pencilOutline,
  peopleOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-schedule-section',
  templateUrl: './schedule-section.component.html',
  styleUrls: ['./schedule-section.component.scss'],
  standalone: true,
  imports: [IonIcon, CommonModule, FormsModule],
})
export class ScheduleSectionComponent implements OnInit {
  // Fix: Make dates a signal so Angular explicitly tracks its changes
  public dates = signal<string[]>([
    '2026-06-21',
    '2026-07-18',
    '2026-08-14',
    '2026-09-10',
    '2026-10-07',
    '2026-11-03',
    '2026-12-01',
  ]);

  readonly patients = input<any[]>([]);

  public scheduleOpen = signal<boolean>(true);
  public editingIdx = signal<number | null>(null);
  public savedIdx = signal<number | null>(null);

  private readonly MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Call this.dates() as a function now that it's a signal
  readonly upcomingDatesCount = computed(
    () => this.dates().filter((d) => !this.isPast(d)).length,
  );
  readonly pastDatesCount = computed(
    () => this.dates().filter((d) => this.isPast(d)).length,
  );

  constructor() {
    addIcons({
      'calendar-outline': calendarOutline,
      'chevron-down-outline': chevronDownOutline,
      'chevron-forward-outline': chevronForwardOutline,
      'pencil-outline': pencilOutline,
      'checkmark-outline': checkmarkOutline,
      'people-outline': peopleOutline,
      'add-outline': addOutline
    });
  }

  ngOnInit() {}

  public toggleSchedule(): void {
    this.scheduleOpen.update((prev) => !prev);
  }

  public isPast(dateStr: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr) < today;
  }

  public getMonthYearLabel(dateStr: string): string {
    const [y, m] = dateStr.split('-').map(Number);
    return `${this.MONTH_NAMES[m - 1]} ${y}`;
  }

  public formatDate(dateStr: string): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  }

  public getOffsetDateLabel(dateStr: string, daysOffset: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + daysOffset);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  }

  public handleDateChange(idx: number, newVal: string): void {
    if (!newVal) return;
    // Update the signal array cleanly
    this.dates.update((current) => {
      const next = [...current];
      next[idx] = newVal;
      return next;
    });
  }

  public saveEditing(idx: number): void {
    this.editingIdx.set(null);
    this.savedIdx.set(idx);
    setTimeout(() => {
      if (this.savedIdx() === idx) this.savedIdx.set(null);
    }, 2000);
  }

  public addNextMonth(): void {
    const currentDates = this.dates();
    const lastDateStr = currentDates[currentDates.length - 1];

    const d = new Date(lastDateStr);
    d.setDate(d.getDate() + 27);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    // Update signal list to instantly push UI updates
    this.dates.update((prev) => [...prev, `${yyyy}-${mm}-${dd}`]);
  }

  public getEnrolledCount(dateStr: string): number {
    return this.patients().filter((p) => p.history && p.history[dateStr])
      .length;
  }
}
