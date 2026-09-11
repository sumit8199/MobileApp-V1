import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
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
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { HeaderComponent } from '../shared/components/header/header.component';
import { AddPatientComponent } from './components/add-patient/add-patient.component';
import { PatientDirectoryComponent } from './components/patient-directory/patient-directory.component';
import { Patient } from '@core/interfaces';
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
export class Tab3Page implements OnInit, OnDestroy, ViewWillEnter {
  private patientApiService = inject(PatientApiService);
  private reminderApiService = inject(ReminderApiService);
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // State Signals
  public showAddPatient = signal<boolean>(false);
  public selectedPatientForEdit = signal<Patient | null>(null);
  public searchQuery = signal<string>('');
  public nextPushyaDate = computed(() => {
    const upcoming = this.reminderApiService.upcomingPushya();
    return upcoming?.pushyaDate || '2026-09-10';
  });

  // Form open status
  public isFormOpen = computed(
    () => this.showAddPatient() || !!this.selectedPatientForEdit()
  );

  // Reactive access to services
  public patients = this.patientApiService.patients;
  public totalPatients = this.patientApiService.totalPatients;
  public currentPage = this.patientApiService.currentPage;
  public pageSize = this.patientApiService.pageSize;
  public totalPages = this.patientApiService.totalPages;
  public isLoading = this.patientApiService.isLoading;
  public isDatabaseConnected = this.patientApiService.isDatabaseConnected;

  constructor() {
    addIcons({ add });
  }

  ngOnInit(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((query) => {
        this.patientApiService
          .loadPatients({
            search: query,
            start: 0,
            pageSize: this.pageSize(),
            page: 1,
          })
          .subscribe();
      });

    this.fetchPatients();
    this.reminderApiService.loadPushyaDates().subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter(): void {
    this.fetchPatients();
  }

  public fetchPatients(event?: any): void {
    const start = (this.currentPage() - 1) * this.pageSize();
    this.patientApiService
      .loadPatients({
        search: this.searchQuery(),
        start,
        pageSize: this.pageSize(),
        page: this.currentPage(),
      })
      .subscribe({
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
    this.searchSubject.next(newQuery);
  }

  public onPageChange(targetPage: number): void {
    const start = (targetPage - 1) * this.pageSize();
    this.patientApiService
      .loadPatients({
        search: this.searchQuery(),
        start,
        pageSize: this.pageSize(),
        page: targetPage,
      })
      .subscribe();
  }

  public openAddForm(): void {
    this.selectedPatientForEdit.set(null);
    this.showAddPatient.set(true);
  }

  public openEditForm(patient: Patient): void {
    this.showAddPatient.set(false);
    this.selectedPatientForEdit.set(patient);
  }

  public closeForm(): void {
    this.showAddPatient.set(false);
    this.selectedPatientForEdit.set(null);
  }

  public onPatientSaved(patient: Patient): void {
    this.closeForm();
    this.fetchPatients();
  }

  public handleDeletePatient(patientId: string): void {
    // If the patient currently open in edit mode was deleted, close the form
    if (this.selectedPatientForEdit()?.id === patientId) {
      this.closeForm();
    }
  }
}
