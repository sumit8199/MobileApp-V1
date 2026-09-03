import { CommonModule } from '@angular/common';
import { Component, input, OnInit, output, inject, computed, signal } from '@angular/core';
import { IonIcon, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  close,
  calendarOutline,
  star,
  checkmarkCircle,
  checkmarkCircleOutline,
  closeCircleOutline,
  timeOutline,
  peopleOutline,
  medkitOutline,
  searchOutline,
  checkmarkDoneOutline,
  arrowUndoOutline,
  sparklesOutline,
  alertCircleOutline,
  informationCircleOutline,
  chevronBackOutline,
  chevronForwardOutline,
} from 'ionicons/icons';
import { PatientApiService } from '@core/services';
import { Patient } from '@core/interfaces';

@Component({
  selector: 'app-calender-details',
  templateUrl: './calender-details.component.html',
  styleUrls: ['./calender-details.component.scss'],
  standalone: true,
  imports: [IonIcon, CommonModule],
})
export class CalenderDetailsComponent implements OnInit {
  private patientApiService = inject(PatientApiService);
  private toastCtrl = inject(ToastController);

  readonly selectedDate = input<string | null>(null);
  readonly isSelectedPushya = input(false);
  readonly isSelectedPast = input(false);
  readonly patients = input<Patient[]>([]);

  readonly close = output<void>();

  // Filter & Search state for attendance view
  public filter = signal<'all' | 'visited' | 'pending'>('all');
  public searchQuery = signal<string>('');

  // Pagination state
  public currentPage = signal<number>(1);
  public pageSize = signal<number>(4);

  // Single reactive source of truth for patient list
  public allPatients = computed(() => {
    const list = this.patientApiService.patients();
    if (list && list.length > 0) return list;
    return this.patients();
  });

  constructor() {
    addIcons({
      close,
      calendarOutline,
      star,
      checkmarkCircle,
      checkmarkCircleOutline,
      closeCircleOutline,
      timeOutline,
      peopleOutline,
      medkitOutline,
      searchOutline,
      checkmarkDoneOutline,
      arrowUndoOutline,
      sparklesOutline,
      alertCircleOutline,
      informationCircleOutline,
      chevronBackOutline,
      chevronForwardOutline,
    });
  }

  ngOnInit() {}

  formatDate(date: string | null): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  onClose(): void {
    this.close.emit();
  }

  /**
   * Only show patients when the date is a Pushyamrut (Pushya) date
   * AND the patient was registered on or before the selected date.
   */
  public eligiblePatients = computed(() => {
    const pDate = this.selectedDate();
    const isPushya = this.isSelectedPushya();
    if (!pDate || !isPushya) return [];

    const sessionDateMs = new Date(pDate).setHours(23, 59, 59, 999);

    return this.allPatients().filter((p) => {
      if (!p.registrationDate) return true;
      const regDateMs = new Date(p.registrationDate).getTime();
      return isNaN(regDateMs) || regDateMs <= sessionDateMs;
    });
  });

  /** Check if patient visited on this date */
  isPatientVisited(patient: Patient): boolean {
    const pDate = this.selectedDate();
    if (!pDate) return false;
    const livePatient = this.allPatients().find((p) => p.id === patient.id) || patient;
    const history = livePatient.history?.[pDate];
    return !!(history?.attended ?? history?.visited);
  }

  /** Get visit time or label */
  getVisitTime(patient: Patient): string {
    const pDate = this.selectedDate();
    if (!pDate) return '';
    const livePatient = this.allPatients().find((p) => p.id === patient.id) || patient;
    const history = livePatient.history?.[pDate];
    return history?.attendedAt || history?.visitedAt || '';
  }

  /** Total visited count for eligible registered patients on selected Pushyamrut date */
  public visitedCount = computed(() => {
    const pDate = this.selectedDate();
    if (!pDate || !this.isSelectedPushya()) return 0;
    return this.eligiblePatients().filter((p) => {
      const h = p.history?.[pDate];
      return !!(h?.attended ?? h?.visited);
    }).length;
  });

  /** Total pending count */
  public pendingCount = computed(() => {
    if (!this.isSelectedPushya()) return 0;
    return Math.max(0, this.eligiblePatients().length - this.visitedCount());
  });

  /** Attendance rate percentage */
  public attendancePercentage = computed(() => {
    const total = this.eligiblePatients().length;
    if (total === 0 || !this.isSelectedPushya()) return 0;
    return Math.round((this.visitedCount() / total) * 100);
  });

  /** Filtered patient list for display */
  public filteredPatients = computed(() => {
    if (!this.isSelectedPushya()) return [];

    const list = this.eligiblePatients();
    const pDate = this.selectedDate();
    const currentFilter = this.filter();
    const query = this.searchQuery().trim().toLowerCase();

    return list.filter((p) => {
      const h = pDate ? p.history?.[pDate] : undefined;
      const isVisited = !!(h?.attended ?? h?.visited);
      
      // Attendance status filter
      if (currentFilter === 'visited' && !isVisited) return false;
      if (currentFilter === 'pending' && isVisited) return false;

      // Search filter
      if (query) {
        const matchName = p.name.toLowerCase().includes(query);
        const matchPhone = p.phone.includes(query);
        return matchName || matchPhone;
      }

      return true;
    });
  });

  /** Paginated subset of filtered patients */
  public pagedPatients = computed(() => {
    const list = this.filteredPatients();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  public totalPages = computed(() =>
    Math.ceil(this.filteredPatients().length / this.pageSize()) || 1
  );

  public startIndex = computed(() =>
    this.filteredPatients().length === 0
      ? 0
      : (this.currentPage() - 1) * this.pageSize() + 1
  );

  public endIndex = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.filteredPatients().length)
  );

  public pagesArray = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  setFilter(filter: 'all' | 'visited' | 'pending'): void {
    this.filter.set(filter);
    this.currentPage.set(1);
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value || '');
    this.currentPage.set(1);
  }

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
   * Toggle visit status for a patient on the selected Pushyamrut date.
   */
  async toggleVisit(patient: Patient): Promise<void> {
    const pDate = this.selectedDate();
    if (!pDate || !this.isSelectedPushya()) return;

    const currentlyVisited = this.isPatientVisited(patient);
    const newStatus = !currentlyVisited;

    this.patientApiService.markVisit(patient.id, pDate, newStatus).subscribe({
      next: async () => {
        const message = newStatus
          ? `Marked ${patient.name} as Visited ✓`
          : `Marked ${patient.name} as Pending`;
        
        const toast = await this.toastCtrl.create({
          message,
          duration: 1500,
          position: 'bottom',
          color: newStatus ? 'success' : 'medium',
        });
        await toast.present();
      },
    });
  }

  /**
   * Mark all eligible registered patients as visited for this Pushyamrut date in one click.
   */
  async markAllVisited(): Promise<void> {
    const pDate = this.selectedDate();
    if (!pDate || !this.isSelectedPushya()) return;

    const unvisitedPatients = this.eligiblePatients().filter((p) => !p.history?.[pDate]?.visited);
    
    if (unvisitedPatients.length === 0) {
      const toast = await this.toastCtrl.create({
        message: 'All registered patients are already marked as visited for this session!',
        duration: 1500,
        position: 'bottom',
        color: 'warning',
      });
      await toast.present();
      return;
    }

    unvisitedPatients.forEach((p) => {
      this.patientApiService.markVisit(p.id, pDate, true).subscribe();
    });

    const toast = await this.toastCtrl.create({
      message: `Marked all ${unvisitedPatients.length} patients as Visited ✓`,
      duration: 2000,
      position: 'bottom',
      color: 'success',
    });
    await toast.present();
  }
}
