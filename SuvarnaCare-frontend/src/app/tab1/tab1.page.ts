import { Component, OnInit, inject, computed, signal } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { CardComponent } from './components/card/card.component';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  starOutline,
  calendarClearOutline,
  checkmarkDoneOutline,
  leafOutline,
  notificationsOutline,
} from 'ionicons/icons';
import { ScheduleSectionComponent } from './components/schedule-section/schedule-section.component';
import { HeaderComponent } from '../shared/components/header/header.component';
import { PatientApiService, ReminderApiService, SqlConnectionService } from '@core/services';

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
    HeaderComponent,
  ],
})
export class Tab1Page implements OnInit, ViewWillEnter {
  private patientApiService = inject(PatientApiService);
  private reminderApiService = inject(ReminderApiService);
  private sqlConnectionService = inject(SqlConnectionService);

  peopleOutline = peopleOutline;
  starOutline = starOutline;
  calendarClearOutline = calendarClearOutline;
  checkmarkDoneOutline = checkmarkDoneOutline;

  // Reactive State Signals
  public patients = this.patientApiService.patients;
  public pushyaDates = this.reminderApiService.pushyaDates;
  public stats = this.reminderApiService.statistics;
  public dbStatus = this.sqlConnectionService.connectionStatus;

  // Dynamic upcoming Pushya session details computed from schedule and current date
  public upcomingPushya = this.reminderApiService.upcomingPushya;

  public nextPushya = computed(() => {
    const upcoming = this.upcomingPushya();
    if (upcoming?.pushyaDate) return upcoming.pushyaDate;
    const list = this.pushyaDates();
    return list.length > 0 ? list[0].pushyaDate : '2026-09-10';
  });

  public reminderDate = computed(() => {
    const upcoming = this.upcomingPushya();
    if (upcoming?.stage1FireDate) return upcoming.stage1FireDate;
    const list = this.pushyaDates();
    return list.length > 0 ? list[0].stage1FireDate : '2026-09-09';
  });

  public stage1Date = this.reminderDate;

  public daysToPushya = computed(() => {
    const targetStr = this.nextPushya();
    if (!targetStr) return '0';
    const target = new Date(targetStr);
    target.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    return diff > 0 ? diff.toString() : '0';
  });

  public nextSessionDisplay = computed(() => {
    const dateStr = this.nextPushya();
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  });

  public messagesReadDisplay = computed(() => {
    const total = this.patients().length;
    const read = this.stats().totalRead;
    return `${read}/${total}`;
  });

  constructor() {
    addIcons({ peopleOutline, leafOutline, notificationsOutline, starOutline, calendarClearOutline, checkmarkDoneOutline });
  }

  ngOnInit(): void {
    this.refreshData();
  }

  ionViewWillEnter(): void {
    this.refreshData();
  }

  private refreshData(): void {
    this.patientApiService.loadPatients().subscribe();
    this.reminderApiService.loadPushyaDates().subscribe();
    this.reminderApiService.loadStatistics().subscribe();
    this.sqlConnectionService.checkConnections().subscribe();
  }
}
