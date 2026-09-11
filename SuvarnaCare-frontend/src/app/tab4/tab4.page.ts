import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonIcon,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logOutOutline,
  personCircleOutline,
  swapHorizontalOutline,
  shieldCheckmarkOutline,
  mailOutline,
} from 'ionicons/icons';
import { HeaderComponent } from '../shared/components/header/header.component';
import { DoctorCardComponent } from './components/doctor-card/doctor-card.component';
import { ClinicInfoComponent } from './components/clinic-info/clinic-info.component';
import { ThemeSelectorComponent } from './components/theme-selector/theme-selector.component';
import { AppInfoComponent } from './components/app-info/app-info.component';
import { ScheduleSectionComponent } from './components/schedule-section/schedule-section.component';
import { PatientApiService, ReminderApiService, AuthService } from '@core/services';

@Component({
  selector: 'app-tab4',
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    CommonModule,
    FormsModule,
    HeaderComponent,
    DoctorCardComponent,
    ClinicInfoComponent,
    ThemeSelectorComponent,
    ScheduleSectionComponent,
    AppInfoComponent,
  ],
})
export class Tab4Page implements OnInit {
  private patientApiService = inject(PatientApiService);
  private reminderApiService = inject(ReminderApiService);
  public authService = inject(AuthService);
  private alertCtrl = inject(AlertController);

  public patients = this.patientApiService.patients;
  public pushyaDatesList = this.reminderApiService.pushyaDates;

  // Reactively resolve doctor info from active authenticated user session
  public doctor = computed(() => {
    const user = this.authService.currentUser();
    if (user) {
      return {
        initials: user.initials || 'DR',
        name: user.name || (user.email ? `Dr. ${user.email.split('@')[0]}` : 'Dr. Meera Vaidya'),
        qualification: user.qualification || 'BAMS, MD (Ayurveda)',
        specialization: user.specialization || 'Suvarna Prashan Specialist',
        clinic: user.clinicName || 'Vaidya Ayurveda Clinic',
        phone: user.phone || '+91 9876500000',
        registration: user.registrationNo || 'AYUSH/MH/2014/0042',
      };
    }
    return {
      initials: 'MV',
      name: 'Dr. Meera Vaidya',
      qualification: 'BAMS, MD (Ayurveda)',
      specialization: 'Suvarna Prashan Specialist',
      clinic: 'Vaidya Ayurveda Clinic',
      phone: '+91 9876500000',
      registration: 'AYUSH/MH/2014/0042',
    };
  });

  public statistics = computed(() => [
    { label: 'Patients', value: Math.max(215, this.patients().length).toString(), icon: 'people-outline' },
    { label: 'Sessions', value: Math.max(26, this.pushyaDatesList().length).toString(), icon: 'calendar-outline' },
    { label: 'Practice', value: '12', icon: 'medal-outline', gold: true },
  ]);

  public pushyaDates = computed(() =>
    this.pushyaDatesList().map((p) => p.pushyaDate)
  );

  constructor() {
    addIcons({
      logOutOutline,
      personCircleOutline,
      swapHorizontalOutline,
      shieldCheckmarkOutline,
      mailOutline,
    });
  }

  ngOnInit(): void {
    this.patientApiService.loadPatients().subscribe();
    this.reminderApiService.loadPushyaDates().subscribe();
  }

  async confirmLogout(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Sign Out',
      subHeader: 'Are you sure you want to sign out?',
      message: 'Your local patient records and schedules will remain securely saved on this device.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'alert-btn-cancel',
        },
        {
          text: 'Sign Out',
          role: 'destructive',
          cssClass: 'alert-btn-logout',
          handler: () => {
            this.authService.logout();
          },
        },
      ],
    });

    await alert.present();
  }
}
