import { Component, computed, input, OnInit, signal, inject, output } from '@angular/core';
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
  createOutline,
  trashOutline,
} from 'ionicons/icons';
import { IonIcon, AlertController, ToastController } from '@ionic/angular/standalone';
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
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  readonly patient = input.required<Patient>();
  readonly nextPushya = input.required<string>();

  // Events emitted to parent
  readonly editPatient = output<Patient>();
  readonly deletePatient = output<string>();

  // Local state managing expand state transitions
  public expanded = signal<boolean>(false);
  public isDeleting = signal<boolean>(false);

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
      createOutline,
      trashOutline,
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

  public onEdit(event: Event): void {
    event.stopPropagation();
    this.editPatient.emit(this.patient());
  }

  public async onDelete(event: Event): Promise<void> {
    event.stopPropagation();
    const p = this.patient();

    const alert = await this.alertCtrl.create({
      header: 'Delete Patient Record?',
      subHeader: `${p.name} (Parent: ${p.parentName})`,
      message: 'Are you sure you want to permanently remove this patient and their complete Pushyamrut attendance history? This action cannot be undone.',
      cssClass: 'custom-delete-alert',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'alert-btn-cancel',
        },
        {
          text: 'Delete Patient',
          role: 'destructive',
          cssClass: 'alert-btn-delete',
          handler: () => {
            this.executeDelete();
          },
        },
      ],
    });

    await alert.present();
  }

  private executeDelete(): void {
    this.isDeleting.set(true);
    const patientId = this.patient().id;
    const patientName = this.patient().name;

    this.patientApiService.deletePatient(patientId).subscribe({
      next: async (success) => {
        this.isDeleting.set(false);
        this.deletePatient.emit(patientId);

        const toast = await this.toastCtrl.create({
          message: `Patient ${patientName} deleted successfully.`,
          duration: 2500,
          position: 'top',
          color: 'success',
          icon: 'trash-outline',
        });
        await toast.present();
      },
      error: async (err) => {
        this.isDeleting.set(false);
        const toast = await this.toastCtrl.create({
          message: `Failed to delete patient: ${err?.message || 'Error'}`,
          duration: 3000,
          position: 'top',
          color: 'danger',
        });
        await toast.present();
      },
    });
  }
}
