import { CommonModule } from '@angular/common';
import { Component, input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonIcon,
  IonCard,
  IonInput,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  flash,
  calendarOutline,
  checkmarkOutline,
  peopleOutline,
  addOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-schedule-section',
  templateUrl: './schedule-section.component.html',
  styleUrls: ['./schedule-section.component.scss'],
  standalone: true,
  imports: [IonCard, CommonModule, IonIcon, IonButton, IonInput, FormsModule],
})
export class ScheduleSectionComponent implements OnInit {
  scheduleOpen = true;
  editingIdx: number | null = null;

  pushyaDates: string[] = [];

  upcomingDates: string[] = [];
  pastDates: string[] = [];
  MONTH_NAMES = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  readonly stage = input<1 | 2>(1);
  readonly label = input('');
  readonly fireDate = input('');
  readonly pushyaDate = input('');
  readonly patients = input<any[]>([]);
  savedIdx: number | null = null;

  readonly GREEN = '#1A4329';
  readonly GREEN_LIGHT = '#EAF5ED';
  readonly GOLD = '#D4AF37';

  get isStage1() {
    return this.stage() === 1;
  }

  get stageKey() {
    return this.isStage1 ? 'stage1Status' : 'stage2Status';
  }

  toggleSchedule() {
    this.scheduleOpen = !this.scheduleOpen;
  }

  setEditing(index: number) {
    this.editingIdx = index;
  }

  get atKey() {
    return this.isStage1 ? 'stage1At' : 'stage2At';
  }

  formatDate(date: string) {
    // your existing function
    return date;
  }
  constructor() {
    addIcons({
      calendarOutline,
      checkmarkOutline,
      peopleOutline,
      addOutline,
      flash,
    });
  }

  ngOnInit() {}

  handleSave(index: number) {
    this.savedIdx = index;
    this.editingIdx = null;
  }

  handleDateChange(index: number, value: string) {
    this.pushyaDates[index] = value;
  }

  addNextMonth() {
    // your logic
  }

  getMonthName(date: string): string {
    const month = Number(date.split('-')[1]);
    return this.MONTH_NAMES[month - 1];
  }

  getYear(date: string): string {
    return date.split('-')[0];
  }

  isPast(date: string): boolean {
    return new Date(date) < new Date();
  }

  offsetDate(date: string, days: number): string {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  getPatientCount(date: string): number {
    return this.patients().filter((patient: any) => !!patient.history?.[date])
      .length;
  }
}
