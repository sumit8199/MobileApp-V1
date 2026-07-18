import { CommonModule } from '@angular/common';
import { Component, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  alertCircleOutline,
  closeOutline,
  flash,
} from 'ionicons/icons';

export interface PatientForm {
  name: string;
  age: string;
  parentName: string;
  phone: string;
  registrationDate: string;
}

export interface FormErrors {
  name?: string;
  age?: string;
  parentName?: string;
  phone?: string;
  registrationDate?: string;
}

@Component({
  selector: 'app-add-patient',
  templateUrl: './add-patient.component.html',
  styleUrls: ['./add-patient.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon],
})
export class AddPatientComponent implements OnInit {
  readonly nextPushya = input.required<string>();
  readonly errors = input<FormErrors>({});

  // Output Events (Replacing React callbacks)
  readonly closeForm = output<void>();
  readonly registerPatient = output<PatientForm>();

  // Local React-like form state managed using an Angular signal
  public form = signal<PatientForm>({
    name: '',
    age: '',
    parentName: '',
    phone: '',
    registrationDate: new Date().toISOString().split('T')[0],
  });
  constructor() {
    addIcons({
      closeOutline,
      alertCircleOutline,
      flash,
      addOutline,
    });
  }

  ngOnInit() {}

  public onPhoneInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    // Strip non-digits and slice to 10 digits max
    const sanitized = inputElement.value.replace(/\D/g, '').slice(0, 10);

    this.form.update((current) => ({
      ...current,
      phone: sanitized,
    }));

    // Keep template view value synced if characters were dropped
    inputElement.value = sanitized;
  }

  public updateField(key: keyof PatientForm, value: string): void {
    this.form.update((current) => ({
      ...current,
      [key]: value,
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
    this.registerPatient.emit(this.form());
  }
}
