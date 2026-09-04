import { CommonModule } from '@angular/common';
import { Component, computed, input, OnInit, output, signal, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonIcon, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  alertCircleOutline,
  closeOutline,
  flash,
  calendarOutline,
  happyOutline,
  checkmarkOutline,
  createOutline,
} from 'ionicons/icons';
import { Patient, PatientForm, FormErrors } from '@core/interfaces';
import { calculateAge } from '@core/dto';
import { PatientApiService } from '@core/services';

@Component({
  selector: 'app-add-patient',
  templateUrl: './add-patient.component.html',
  styleUrls: ['./add-patient.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon],
})
export class AddPatientComponent implements OnInit {
  private patientApiService = inject(PatientApiService);
  private toastCtrl = inject(ToastController);

  // When patient is provided, component switches to Edit mode; otherwise Add mode
  readonly patient = input<Patient | null>(null);
  readonly nextPushya = input.required<string>();

  // Output Events
  readonly closeForm = output<void>();
  readonly patientSaved = output<Patient>();

  // Form state
  public isSubmitting = signal<boolean>(false);
  public formErrors = signal<FormErrors>({});

  public form = signal<PatientForm>({
    name: '',
    birthDate: '',
    phone: '',
    registrationDate: new Date().toISOString().split('T')[0],
  });

  // Edit Mode Flag
  readonly isEditMode = computed(() => !!this.patient());

  // Maximum selectable birth date is today
  readonly todayDate = new Date().toISOString().split('T')[0];

  // Dynamic calculated age derived automatically from birthDate
  readonly calculatedAge = computed(() => {
    const dob = this.form().birthDate;
    if (!dob) return '';
    return calculateAge(dob);
  });

  constructor() {
    addIcons({
      closeOutline,
      alertCircleOutline,
      flash,
      addOutline,
      calendarOutline,
      happyOutline,
      checkmarkOutline,
      createOutline,
    });

    // Populate or reset form when patient input changes
    effect(() => {
      const p = this.patient();
      if (p) {
        this.form.set({
          name: p.name || '',
          birthDate: p.birthDate || '',
          phone: (p.phone || '').replace(/\D/g, '').slice(0, 10),
          registrationDate: p.registrationDate || new Date().toISOString().split('T')[0],
        });
      } else {
        this.form.set({
          name: '',
          birthDate: '',
          phone: '',
          registrationDate: new Date().toISOString().split('T')[0],
        });
      }
      this.formErrors.set({});
      this.isSubmitting.set(false);
    });
  }

  ngOnInit() {
    const p = this.patient();
    if (p) {
      this.form.set({
        name: p.name || '',
        birthDate: p.birthDate || '',
        phone: (p.phone || '').replace(/\D/g, '').slice(0, 10),
        registrationDate: p.registrationDate || new Date().toISOString().split('T')[0],
      });
    }
  }

  public onPhoneInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const sanitized = inputElement.value.replace(/\D/g, '').slice(0, 10);

    this.form.update((current) => ({
      ...current,
      phone: sanitized,
    }));

    inputElement.value = sanitized;

    if (sanitized.length === 10) {
      this.formErrors.update((current) => ({
        ...current,
        phone: undefined,
      }));
    }
  }

  public updateField(key: keyof PatientForm, value: string): void {
    this.form.update((current) => ({
      ...current,
      [key]: value,
    }));

    // Clear field error on edit
    this.formErrors.update((current) => ({
      ...current,
      [key]: undefined,
    }));
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

  public submitForm(): void {
    const data = this.form();
    const errors: FormErrors = {};

    if (!data.name.trim()) {
      errors.name = "Patient's full name is required";
    }
    if (data.birthDate && data.birthDate.trim()) {
      const dob = new Date(data.birthDate);
      if (isNaN(dob.getTime()) || dob > new Date()) {
        errors.birthDate = 'Please select a valid past date of birth';
      }
    }
    if (!data.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (data.phone.length !== 10) {
      errors.phone = 'Please enter a valid 10-digit mobile number';
    }

    if (Object.keys(errors).length > 0) {
      this.formErrors.set(errors);
      return;
    }

    this.formErrors.set({});
    this.isSubmitting.set(true);

    if (this.isEditMode()) {
      // Execute Edit / Update API
      const patientId = this.patient()!.id;
      this.patientApiService.updatePatient(patientId, data).subscribe({
        next: async (updatedPatient) => {
          this.isSubmitting.set(false);
          const toast = await this.toastCtrl.create({
            message: `Patient ${updatedPatient?.name || data.name} updated successfully.`,
            duration: 2500,
            position: 'top',
            color: 'success',
            icon: 'checkmark-circle',
          });
          await toast.present();
          if (updatedPatient) {
            this.patientSaved.emit(updatedPatient);
          }
          this.closeForm.emit();
        },
        error: async (err) => {
          this.isSubmitting.set(false);
          const toast = await this.toastCtrl.create({
            message: `Failed to update patient: ${err?.message || 'Error'}`,
            duration: 3000,
            position: 'top',
            color: 'danger',
          });
          await toast.present();
        },
      });
    } else {
      // Execute Add / Register API
      this.patientApiService.createPatient(data, this.nextPushya()).subscribe({
        next: async (newPatient) => {
          this.isSubmitting.set(false);
          const toast = await this.toastCtrl.create({
            message: `Patient ${newPatient.name} registered successfully.`,
            duration: 2500,
            position: 'top',
            color: 'success',
          });
          await toast.present();
          this.patientSaved.emit(newPatient);
          this.closeForm.emit();
        },
        error: async (err) => {
          this.isSubmitting.set(false);
          const toast = await this.toastCtrl.create({
            message: `Failed to register patient: ${err?.message || 'Error'}`,
            duration: 3000,
            position: 'top',
            color: 'danger',
          });
          await toast.present();
        },
      });
    }
  }
}
