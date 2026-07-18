import { Component, input, Input, OnInit } from '@angular/core';
import { AvatarComponent } from '../avatar/avatar.component';
import { StatCardComponent } from '../stat-card/stat-card.component';

interface DoctorInfo {
  initials: string;
  name: string;
  qualification: string;
  specialization: string;
  clinic: string;
  phone: string;
  registration: string;
}

interface StatInfo {
  label: string;
  value: string;
  icon: string;
  gold?: boolean;
}

@Component({
  selector: 'app-doctor-card',
  templateUrl: './doctor-card.component.html',
  styleUrls: ['./doctor-card.component.scss'],
  standalone: true,
  imports: [AvatarComponent, StatCardComponent],
})
export class DoctorCardComponent implements OnInit {
  // doctor = {
  //   initials: 'MV',
  //   name: 'Dr. Meera Vaidya',
  //   qualification: 'BAMS, MD (Ayurveda)',
  //   specialization: 'Suvarna Prashan Specialist',
  //   clinic: 'Vaidya Ayurveda Clinic',
  //   phone: '+91 9876500000',
  //   registration: 'AYUSH/MH/2014/0042',
  // };

  // statistics = [
  //   {
  //     label: 'Patients',
  //     value: '215',
  //     icon: 'people-outline',
  //   },
  //   {
  //     label: 'Sessions',
  //     value: '26',
  //     icon: 'calendar-outline',
  //   },
  //   {
  //     label: 'Practice',
  //     value: '12',
  //     icon: 'medal-outline',
  //     gold: true,
  //   },
  // ];

  // pushyaDates = ['2026-07-18', '2026-08-14', '2026-09-11'];

  // initials = "SP"

  readonly doctor = input.required<DoctorInfo>();
  readonly statistics = input.required<StatInfo[]>();

  pushyaDates = ['2026-07-18', '2026-08-14', '2026-09-11'];
  initials = "SP";
  
  constructor() {}

  ngOnInit() {}
}
