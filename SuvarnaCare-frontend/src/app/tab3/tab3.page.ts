import { Component, signal } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFabButton,
  IonFab,
  IonIcon,
  IonSearchbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { HeaderComponent } from '../componants/header/header.component';
import { AddPatientComponent } from './components/add-patient/add-patient.component';
import { Patient, PatientDirectoryComponent } from './components/patient-directory/patient-directory.component';

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
    HeaderComponent,
    IonSearchbar,
    AddPatientComponent,
    PatientDirectoryComponent,
  ],
})
export class Tab3Page {
  // Signal tracking visibility state
  public showAddPatient = signal<boolean>(false);
  public searchQuery = signal<string>('');

  // 3. Define static/mock patient data layout matching the Patient interface
  public patientList: Patient[] = [
    {
      id: '1',
      name: 'Arjun Sharma',
      age: '2 years, 8 months',
      parentName: 'Vikram Sharma',
      phone: '9876543210',
      registrationDate: '2026-06-15',
      history: {
        '2026-07-18': {
          stage1Status: 'read',
          stage1At: '09:00 AM',
          stage2Status: 'sent',
        },
      },
    },
  ];

  constructor() {
    addIcons({ add });
  }

  public addItem() {
    this.showAddPatient.set(true);
  }

  public closeForm() {
    this.showAddPatient.set(false);
  }
}
