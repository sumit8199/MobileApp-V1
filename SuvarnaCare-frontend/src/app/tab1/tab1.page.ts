import { Component } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonButton,
} from '@ionic/angular/standalone';
import { CardComponent } from '../componants/card/card.component';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  starOutline,
  calendarClearOutline,
  checkmarkDoneOutline,
  leafOutline, 
  notificationsOutline
} from 'ionicons/icons';
import { ScheduleSectionComponent } from '../componants/schedule-section/schedule-section.component';
import { HeaderComponent } from '../componants/header/header.component';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    CardComponent,
    ScheduleSectionComponent,
    HeaderComponent
  ],
})
export class Tab1Page {
  peopleOutline = peopleOutline;
  starOutline = starOutline;
  calendarClearOutline = calendarClearOutline;
  checkmarkDoneOutline = checkmarkDoneOutline;
  stage1Date = '';
  nextPushya = '';

  patients = [
    {
      id: '1',
      name: 'Arjun Sharma',
      age: '2 yrs',
      parentName: 'Vikram Sharma',
      phone: '9876543210',
      registrationDate: '2026-02-15',
      history: {
        '2026-06-21': {
          stage1Status: 'read',
          stage1At: 'Jun 18, 9:02 AM',
          stage2Status: 'read',
          stage2At: 'Jun 21, 7:30 AM',
        },
        '2026-07-18': { stage1Status: 'scheduled', stage2Status: 'scheduled' },
      },
    },
    {
      id: '2',
      name: 'Priya Patel',
      age: '18 mo',
      parentName: 'Suresh Patel',
      phone: '9876543211',
      registrationDate: '2026-04-10',
      history: {
        '2026-06-21': {
          stage1Status: 'read',
          stage1At: 'Jun 18, 9:02 AM',
          stage2Status: 'delivered',
          stage2At: 'Jun 21, 7:30 AM',
        },
        '2026-07-18': { stage1Status: 'scheduled', stage2Status: 'scheduled' },
      },
    },
    {
      id: '3',
      name: 'Kavya Nair',
      age: '3 yrs',
      parentName: 'Rajan Nair',
      phone: '9876543212',
      registrationDate: '2026-03-20',
      history: {
        '2026-06-21': {
          stage1Status: 'delivered',
          stage1At: 'Jun 18, 9:02 AM',
          stage2Status: 'sent',
          stage2At: 'Jun 21, 7:30 AM',
        },
        '2026-07-18': { stage1Status: 'scheduled', stage2Status: 'scheduled' },
      },
    },
    {
      id: '4',
      name: 'Rohan Desai',
      age: '8 mo',
      parentName: 'Amit Desai',
      phone: '9876543213',
      registrationDate: '2026-05-05',
      history: {
        '2026-06-21': {
          stage1Status: 'read',
          stage1At: 'Jun 18, 9:03 AM',
          stage2Status: 'read',
          stage2At: 'Jun 21, 7:31 AM',
        },
        '2026-07-18': { stage1Status: 'scheduled', stage2Status: 'scheduled' },
      },
    },
    {
      id: '5',
      name: 'Ananya Joshi',
      age: '2.5 yrs',
      parentName: 'Deepak Joshi',
      phone: '9876543214',
      registrationDate: '2026-06-12',
      history: {
        '2026-06-21': {
          stage1Status: 'sent',
          stage1At: 'Jun 18, 9:03 AM',
          stage2Status: 'sent',
          stage2At: 'Jun 21, 7:31 AM',
        },
        '2026-07-18': { stage1Status: 'scheduled', stage2Status: 'scheduled' },
      },
    },
  ];
  constructor() {
    addIcons({ peopleOutline, leafOutline, notificationsOutline});
  }
}
