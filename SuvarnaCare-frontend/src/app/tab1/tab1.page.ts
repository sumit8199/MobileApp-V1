import { Component, OnInit, inject, computed } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { CardComponent } from '../componants/card/card.component';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  starOutline,
  calendarClearOutline,
  checkmarkDoneOutline,
  leafOutline,
  notificationsOutline,
} from 'ionicons/icons';
import { ScheduleSectionComponent } from '../componants/schedule-section/schedule-section.component';
import { HeaderComponent } from '../componants/header/header.component';
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

  // Next Pushya details computed dynamically
  public nextPushya = computed(() => {
    const list = this.pushyaDates();
    return list.length > 0 ? list[0].pushyaDate : '2026-07-18';
  });

  public stage1Date = computed(() => {
    const list = this.pushyaDates();
    return list.length > 0 ? list[0].stage1FireDate : '2026-07-15';
  });

  public daysToPushya = computed(() => {
    const target = new Date(this.nextPushya());
    const today = new Date();
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff.toString() : '0';
  });

  public nextSessionDisplay = computed(() => {
    const dateStr = this.nextPushya();
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '18 Jul';
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
