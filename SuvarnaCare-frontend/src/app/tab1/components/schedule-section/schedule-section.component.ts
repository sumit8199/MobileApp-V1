import { CommonModule } from '@angular/common';
import { Component, input, OnInit, inject, signal, computed } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  flash,
  checkmarkDone,
  paperPlane,
  timeOutline,
  checkmark,
  chevronBackOutline,
  chevronForwardOutline,
} from 'ionicons/icons';
import { PatientApiService } from '@core/services';
import { Patient } from '@core/interfaces';

@Component({
  selector: 'app-schedule-section',
  templateUrl: './schedule-section.component.html',
  styleUrls: ['./schedule-section.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon],
})
export class ScheduleSectionComponent implements OnInit {
  private patientApiService = inject(PatientApiService);

  readonly stage = input<1 | 2>(1);
  readonly label = input('');
  readonly fireDate = input('');
  readonly pushyaDate = input('');
  readonly patients = input<Patient[]>([]);

  // Pagination state
  public currentPage = signal<number>(1);
  public pageSize = signal<number>(4);

  public totalPages = computed(() =>
    Math.ceil(this.patients().length / this.pageSize()) || 1
  );

  public pagedPatients = computed(() => {
    const list = this.patients();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  public startIndex = computed(() =>
    this.patients().length === 0
      ? 0
      : (this.currentPage() - 1) * this.pageSize() + 1
  );

  public endIndex = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.patients().length)
  );

  public pagesArray = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  get isStage1() {
    return this.stage() === 1;
  }

  get stageKey() {
    return this.isStage1 ? 'stage1Status' : 'stage2Status';
  }

  get atKey() {
    return this.isStage1 ? 'stage1At' : 'stage2At';
  }

  formatDate(date: string) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  constructor() {
    addIcons({
      flash,
      checkmarkDone,
      paperPlane,
      timeOutline,
      checkmark,
      chevronBackOutline,
      chevronForwardOutline,
    });
  }

  ngOnInit() { }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
    }
  }

  /**
   * Cycles status for a patient dose record on this Pushya date (scheduled -> sent -> delivered -> read).
   */
  cycleStatus(patient: Patient): void {
    const pDate = this.pushyaDate();
    if (!pDate) return;

    const currentHistory = patient.history?.[pDate];
    const isStage1 = this.stage() === 1;
    const currentStatus = isStage1 ? currentHistory?.stage1Status : currentHistory?.stage2Status;

    const nextStatusMap: Record<string, string> = {
      scheduled: 'sent',
      sent: 'delivered',
      delivered: 'read',
      read: 'scheduled',
    };

    const nextStatus = nextStatusMap[currentStatus || 'scheduled'] || 'scheduled';

    if (isStage1) {
      this.patientApiService.recordSession(patient.id, pDate, nextStatus, currentHistory?.stage2Status).subscribe();
    } else {
      this.patientApiService.recordSession(patient.id, pDate, currentHistory?.stage1Status, nextStatus).subscribe();
    }
  }
}
