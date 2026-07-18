import { Component } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonChip,
  IonLabel,
  DatetimeCustomEvent,
} from '@ionic/angular/standalone';
import { IonDatetime } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { CalenderDetailsComponent } from '../componants/calender-details/calender-details.component';
import { HeaderComponent } from "../componants/header/header.component";
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
    HeaderComponent
],
})
export class Tab2Page {
  public datetime: string = new Date().toISOString();

  selectedDate: string | null = null;

  isSelectedPushya = false;

  isSelectedPast = false;

  patients = [
    {
      id: 1,
      name: 'Rahul',
      history: {
        '2026-07-18': {
          stage1Status: 'read',
          stage2Status: 'scheduled',
        },
      },
    },
  ]; // your patient list

  pushyaDates = ['2026-07-18', '2026-08-15', '2026-09-11'];

  public highlightedDates = [
    {
      date: '2026-07-15',
      textColor: '#ffffff',
      backgroundColor: '#da5296', // Matching Pushya Indicator Color
    },
    {
      date: '2026-07-25',
      textColor: '#ffffff',
      backgroundColor: '#da5296',
    },
  ];

  constructor() {}

  ngOnInit() {
    const date = new Date();

    // Set the value of the datetime to 2 days
    // before the current day
    let dayChange = -2;

    // If the day we are going to set the value to
    // is in the previous month then set the day 2 days
    // later instead so it remains in the same month
    if (date.getDate() + dayChange <= 0) {
      dayChange = -dayChange;
    }

    // Set the value of the datetime to the day
    // calculated above
    date.setDate(date.getDate() + dayChange);
    this.datetime = date.toISOString();
  }

  onDateSelected(event: CustomEvent) {
    const value = event.detail.value;

    // Handle null
    if (!value) {
      this.selectedDate = null;
      return;
    }

    // Handle multiple selection (if ever enabled)
    if (Array.isArray(value)) {
      this.selectedDate = value[0]?.substring(0, 10) ?? null;
    } else {
      this.selectedDate = value.substring(0, 10);
    }

    // selectedDate can still be null, so check it
    if (!this.selectedDate) {
      return;
    }

    this.isSelectedPushya = this.pushyaDates.includes(this.selectedDate);

    this.isSelectedPast =
      new Date(this.selectedDate).getTime() < new Date().getTime();
  }

  clearSelection() {
    this.selectedDate = null;
    this.datetime = '';
  }
}
