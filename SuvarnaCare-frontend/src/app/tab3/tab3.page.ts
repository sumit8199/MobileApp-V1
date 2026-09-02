import { Component, OnInit, inject, signal, computed } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFabButton,
  IonFab,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { HeaderComponent } from '../componants/header/header.component';
import { AddPatientComponent } from './components/add-patient/add-patient.component';
import { PatientDirectoryComponent } from './components/patient-directory/patient-directory.component';
import { Patient, PatientForm } from '@core/interfaces';
import { PatientApiService, ReminderApiService } from '@core/services';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFabButton,
    IonFab,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    HeaderComponent,
    AddPatientComponent,
    PatientDirectoryComponent,
  ],
})
export class Tab3Page implements OnInit, ViewWillEnter {
  private patientApiService = inject(PatientApiService);
  private reminderApiService = inject(ReminderApiService);

  // State Signals
  public showAddPatient = signal<boolean>(false);
  public searchQuery = signal<string>('');
  public nextPushyaDate = signal<string>('2026-07-18');

  // Reactive access to services
  public patients = this.patientApiService.patients;
  public isLoading = this.patientApiService.isLoading;
  public isDatabaseConnected = this.patientApiService.isDatabaseConnected;

  // Filtered patients computed from search query
  public filteredPatients = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.patients();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.parentName.toLowerCase().includes(q)
    );
  });

  constructor() {
    addIcons({ add });
  }

  ngOnInit(): void {
    this.fetchPatients();
    this.reminderApiService.loadPushyaDates().subscribe((dates) => {
      if (dates && dates.length > 0) {
        this.nextPushyaDate.set(dates[0].pushyaDate);
      }
    });
  }

  ionViewWillEnter(): void {
    this.fetchPatients();
  }

  public fetchPatients(event?: any): void {
    this.patientApiService.loadPatients(this.searchQuery()).subscribe({
      next: () => {
        if (event) event.target.complete();
      },
      error: () => {
        if (event) event.target.complete();
      },
    });
  }

  public onSearchChange(newQuery: string): void {
    this.searchQuery.set(newQuery);
    // Fetch directly from backend GET /api/patients?search=...
    this.patientApiService.loadPatients(newQuery).subscribe();
  }

  public addItem(): void {
    this.showAddPatient.set(true);
  }

  public closeForm(): void {
    this.showAddPatient.set(false);
  }

  public handleRegisterPatient(form: PatientForm): void {
    this.patientApiService.createPatient(form, this.nextPushyaDate()).subscribe(() => {
      this.closeForm();
      this.fetchPatients();
    });
  }
}
