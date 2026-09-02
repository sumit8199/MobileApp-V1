import { Component, computed, input, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Patient } from '@core/interfaces';
import { addIcons } from 'ionicons';
import {
  chevronForwardOutline,
  timeOutline,
  checkmarkCircleOutline,
  checkmarkCircle,
  flashOutline,
  medkitOutline,
} from 'ionicons/icons';
import { IonIcon } from '@ionic/angular/standalone';
import { PatientApiService } from '@core/services';

@Component({
  selector: 'app-patient-card',
  templateUrl: './patient-card.component.html',
  styleUrls: ['./patient-card.component.scss'],
  standalone: true,
  imports: [IonIcon, CommonModule],
})
export class PatientCardComponent implements OnInit {
  private patientApiService = inject(PatientApiService);

  readonly patient = input.required<Patient>();
  readonly nextPushya = input.required<string>();

  // Local state managing expand state transitions
  public expanded = signal<boolean>(false);

  // All session dates from history plus upcoming nextPushya if registered
  readonly allSessionDates = computed(() => {
    const dates = new Set<string>();
    const next = this.nextPushya();
    if (next) dates.add(next);

    const history = this.patient().history || {};
    Object.keys(history).forEach((d) => dates.add(d));

    return Array.from(dates).sort((a, b) => a.localeCompare(b));
  });

  // Check if patient has visited for next Pushya date
  readonly isVisitedForNextPushya = computed(() => {
    const next = this.nextPushya();
    if (!next) return false;
    const history = this.patient().history?.[next];
    return !!(history?.visited ?? history?.attended);
  });

  readonly nextVisitTime = computed(() => {
    const next = this.nextPushya();
    if (!next) return '';
    const history = this.patient().history?.[next];
    return history?.visitedAt || history?.attendedAt || '';
  });

  constructor() {
    addIcons({
      chevronForwardOutline,
      timeOutline,
      checkmarkCircleOutline,
      checkmarkCircle,
      flashOutline,
      medkitOutline,
    });
  }

  ngOnInit() {}

  public toggleExpand(): void {
    this.expanded.update((v) => !v);
  }

  public isPast(dateStr: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr) < today;
  }

  public formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  }

  public isSessionVisited(sessionDate: string): boolean {
    const history = this.patient().history?.[sessionDate];
    return !!(history?.visited ?? history?.attended);
  }

  public getSessionVisitTime(sessionDate: string): string {
    const history = this.patient().history?.[sessionDate];
    return history?.visitedAt || history?.attendedAt || '';
  }

  public toggleVisit(sessionDate: string, event: Event): void {
    event.stopPropagation();
    this.patientApiService.toggleVisit(this.patient().id, sessionDate).subscribe();
  }
}
