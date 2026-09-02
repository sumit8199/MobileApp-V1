import { Component, computed, input, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon, ToastController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  calendarOutline,
  checkmarkOutline,
  chevronDownOutline,
  chevronForwardOutline,
  pencilOutline,
  peopleOutline,
  closeOutline,
  trashOutline,
} from 'ionicons/icons';
import { ReminderApiService } from '@core/services';

@Component({
  selector: 'app-schedule-section',
  templateUrl: './schedule-section.component.html',
  styleUrls: ['./schedule-section.component.scss'],
  standalone: true,
  imports: [IonIcon, CommonModule, FormsModule],
})
export class ScheduleSectionComponent implements OnInit {
  private reminderApiService = inject(ReminderApiService);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  // Directly derive schedule dates from ReminderApiService reactive signal
  public pushyaSchedules = this.reminderApiService.pushyaDates;
  public dates = computed(() => this.pushyaSchedules().map((s) => s.pushyaDate));

  readonly patients = input<any[]>([]);

  public scheduleOpen = signal<boolean>(true);
  public editingIdx = signal<number | null>(null);
  public tempEditDate = signal<string>('');
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

  readonly upcomingDatesCount = computed(
    () => this.dates().filter((d) => !this.isPast(d)).length
  );
  readonly pastDatesCount = computed(
    () => this.dates().filter((d) => this.isPast(d)).length
  );

  constructor() {
    addIcons({
      'calendar-outline': calendarOutline,
      'chevron-down-outline': chevronDownOutline,
      'chevron-forward-outline': chevronForwardOutline,
      'pencil-outline': pencilOutline,
      'checkmark-outline': checkmarkOutline,
      'people-outline': peopleOutline,
      'add-outline': addOutline,
      'close-outline': closeOutline,
      'trash-outline': trashOutline,
    });
  }

  ngOnInit() {
    this.reminderApiService.loadPushyaDates().subscribe();
  }

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
    if (!dateStr) return '';
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

  public startEditing(idx: number): void {
    const current = this.dates()[idx];
    this.tempEditDate.set(current || '');
    this.editingIdx.set(idx);
  }

  public cancelEditing(): void {
    this.editingIdx.set(null);
    this.tempEditDate.set('');
  }

  public async saveEditing(idx: number): Promise<void> {
    const newDate = this.tempEditDate().trim();
    if (!newDate) {
      this.editingIdx.set(null);
      return;
    }

    this.reminderApiService.updatePushyaDate(idx, newDate).subscribe({
      next: async () => {
        this.editingIdx.set(null);
        this.savedIdx.set(idx);

        const toast = await this.toastCtrl.create({
          message: `Updated Pushyamrut session to ${this.formatDate(newDate)}`,
          duration: 1500,
          position: 'bottom',
          color: 'success',
        });
        await toast.present();

        setTimeout(() => {
          if (this.savedIdx() === idx) this.savedIdx.set(null);
        }, 2000);
      },
    });
  }

  public async confirmDeleteSession(idx: number, date: string): Promise<void> {
    const formatted = this.formatDate(date);
    const alert = await this.alertCtrl.create({
      header: 'Delete Session',
      subHeader: `Pushyamrut Session: ${formatted}`,
      message: 'Are you sure you want to remove this Pushyamrut date from the schedule?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.reminderApiService.deletePushyaDate(idx).subscribe({
              next: async () => {
                const toast = await this.toastCtrl.create({
                  message: `Removed session for ${formatted}`,
                  duration: 1500,
                  position: 'bottom',
                  color: 'medium',
                });
                await toast.present();
              },
            });
          },
        },
      ],
    });

    await alert.present();
  }

  public async addNextMonth(): Promise<void> {
    const currentDates = this.dates();
    const lastDateStr = currentDates.length > 0
      ? currentDates[currentDates.length - 1]
      : new Date().toISOString().split('T')[0];

    const d = new Date(lastDateStr);
    d.setDate(d.getDate() + 27);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const newDate = `${yyyy}-${mm}-${dd}`;

    this.reminderApiService.addPushyaDate(newDate).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({
          message: `Added new Pushyamrut session for ${this.formatDate(newDate)}`,
          duration: 1500,
          position: 'bottom',
          color: 'success',
        });
        await toast.present();
      },
    });
  }

  public getEnrolledCount(dateStr: string): number {
    return this.patients().filter((p) => p.history && p.history[dateStr]).length;
  }
}
