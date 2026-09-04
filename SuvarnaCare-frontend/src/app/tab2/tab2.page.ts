import { Component, OnInit, inject, computed, signal } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonChip,
  IonLabel,
  IonDatetime,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { CalenderDetailsComponent } from './components/calender-details/calender-details.component';
import { HeaderComponent } from '../shared/components/header/header.component';
import { PatientApiService, ReminderApiService } from '@core/services';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonDatetime,
    FormsModule,
    IonChip,
    IonLabel,
    CalenderDetailsComponent,
    HeaderComponent,
  ],
})
export class Tab2Page implements OnInit, ViewWillEnter {
  private patientApiService = inject(PatientApiService);
  private reminderApiService = inject(ReminderApiService);

  public datetime: string = new Date().toISOString();
  public selectedDate: string | null = null;
  public isSelectedPushya = false;
  public isSelectedPast = false;

  // Reactive state signals from services
  public patients = this.patientApiService.patients;
  public pushyaDatesList = this.reminderApiService.pushyaDates;

  public pushyaDates = computed(() =>
    this.pushyaDatesList().map((p) => p.pushyaDate)
  );

  public highlightedDates = computed(() =>
    this.pushyaDatesList().map((p) => ({
      date: p.pushyaDate,
      textColor: '#ffffff',
      backgroundColor: '#da5296',
    }))
  );

  constructor() {}

  ngOnInit(): void {
    this.refreshData();
  }

  ionViewWillEnter(): void {
    this.refreshData();
  }

  private refreshData(): void {
    this.patientApiService.loadPatients().subscribe();
    this.reminderApiService.loadPushyaDates().subscribe({
      next: (dates) => {
        if (!this.selectedDate && dates && dates.length > 0) {
          const todayMs = new Date().setHours(0, 0, 0, 0);
          const next =
            dates.find((d) => new Date(d.pushyaDate).getTime() >= todayMs) ||
            dates[0];
          if (next) {
            this.selectedDate = next.pushyaDate;
            this.datetime = next.pushyaDate;
            this.isSelectedPushya = true;
            this.isSelectedPast =
              new Date(next.pushyaDate).getTime() < new Date().getTime();
          }
        }
      },
    });
  }

  onDateSelected(event: CustomEvent): void {
    const value = event.detail.value;

    if (!value) {
      this.selectedDate = null;
      return;
    }

    if (Array.isArray(value)) {
      this.selectedDate = value[0]?.substring(0, 10) ?? null;
    } else {
      this.selectedDate = value.substring(0, 10);
    }

    if (!this.selectedDate) return;

    this.isSelectedPushya = this.pushyaDates().includes(this.selectedDate);
    this.isSelectedPast = new Date(this.selectedDate).getTime() < new Date().getTime();
  }

  clearSelection(): void {
    this.selectedDate = null;
    this.datetime = '';
  }
}
