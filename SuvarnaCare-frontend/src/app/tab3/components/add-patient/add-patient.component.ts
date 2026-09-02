import { CommonModule } from '@angular/common';
import { Component, computed, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  alertCircleOutline,
  closeOutline,
  flash,
  calendarOutline,
  happyOutline,
} from 'ionicons/icons';
import { PatientForm, FormErrors } from '@core/interfaces';
import { calculateAge } from '@core/dto';

@Component({
  selector: 'app-add-patient',
  templateUrl: './add-patient.component.html',
  styleUrls: ['./add-patient.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon],
})
export class AddPatientComponent implements OnInit {
  readonly nextPushya = input.required<string>();

  // Output Events
  readonly closeForm = output<void>();
  readonly registerPatient = output<PatientForm>();

  // Form errors state
  public formErrors = signal<FormErrors>({});

  // Local form state with birthDate
  public form = signal<PatientForm>({
    name: '',
    birthDate: '',
    parentName: '',
    phone: '',
    registrationDate: new Date().toISOString().split('T')[0],
  });

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
    });
  }

  ngOnInit() {}

  public onPhoneInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const sanitized = inputElement.value.replace(/\D/g, '').slice(0, 10);

    this.form.update((current) => ({
      ...current,
      phone: sanitized,
    }));

    inputElement.value = sanitized;
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
      errors.name = "Child's name is required";
    }
    if (!data.birthDate.trim()) {
      errors.birthDate = 'Date of birth is required';
    } else {
      const dob = new Date(data.birthDate);
      if (isNaN(dob.getTime()) || dob > new Date()) {
        errors.birthDate = 'Please select a valid past date of birth';
      }
    }
    if (!data.parentName.trim()) {
      errors.parentName = 'Parent / Guardian name is required';
    }
    if (!data.phone.trim() || data.phone.length < 10) {
      errors.phone = 'Please enter a valid 10-digit mobile number';
    }

    if (Object.keys(errors).length > 0) {
      this.formErrors.set(errors);
      return;
    }

    this.formErrors.set({});
    this.registerPatient.emit(data);
  }
}
