import { Component, input, model, OnInit, output } from '@angular/core';
import { addIcons } from 'ionicons';
import {
  addOutline,
  closeCircleOutline,
  peopleOutline,
  searchOutline,
} from 'ionicons/icons';
import { IonIcon } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { PatientCardComponent } from '../patient-card/patient-card.component';
import { FormsModule } from '@angular/forms';

export interface Patient {
  id: string;
  name: string;
  age: string;
  parentName: string;
  phone: string;
  registrationDate: string;
  history: Record<
    string,
    {
      stage1Status: string;
      stage1At?: string;
      stage2Status: string;
      stage2At?: string;
    }
  >;
}

@Component({
  selector: 'app-patient-directory',
  templateUrl: './patient-directory.component.html',
  styleUrls: ['./patient-directory.component.scss'],
  standalone: true,
  imports: [IonIcon, CommonModule, PatientCardComponent, FormsModule],
})
export class PatientDirectoryComponent implements OnInit {
  readonly patients = input.required<Patient[]>();
  readonly allCount = input.required<number>();
  readonly nextPushya = input.required<string>();

  // Two-way signal model binding for the search string
  readonly search = model<string>('');

  // Event emitters to notify parent page state actions
  readonly openAddForm = output<void>();

  constructor() {
    addIcons({
      addOutline,
      searchOutline,
      closeCircleOutline,
      peopleOutline,
    });
  }

  ngOnInit() {}

  public formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  }
}
