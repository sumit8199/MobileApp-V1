import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { HeaderComponent } from '../componants/header/header.component';
import { DoctorCardComponent } from './components/doctor-card/doctor-card.component';
import { ClinicInfoComponent } from './components/clinic-info/clinic-info.component';
import { AppInfoComponent } from './components/app-info/app-info.component';
import { ScheduleSectionComponent } from '../tab4/components/schedule-section/schedule-section.component';

@Component({
  selector: 'app-tab4',
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, HeaderComponent , DoctorCardComponent, ClinicInfoComponent, ScheduleSectionComponent, AppInfoComponent]
})
export class Tab4Page implements OnInit {

  doctor = {
    initials: 'MV',
    name: 'Dr. Meera Vaidya',
    qualification: 'BAMS, MD (Ayurveda)',
    specialization: 'Suvarna Prashan Specialist',
    clinic: 'Vaidya Ayurveda Clinic',
    phone: '+91 9876500000',
    registration: 'AYUSH/MH/2014/0042',
  };

  statistics = [
    { label: 'Patients', value: '215', icon: 'people-outline' },
    { label: 'Sessions', value: '26', icon: 'calendar-outline' },
    { label: 'Practice', value: '12', icon: 'medal-outline', gold: true },
  ];

  public pushyaDates = [
  "2026-06-21","2026-07-18","2026-08-14",
  "2026-09-10","2026-10-07","2026-11-03","2026-12-01",
];

  constructor() { }

  ngOnInit() {
  }

}
