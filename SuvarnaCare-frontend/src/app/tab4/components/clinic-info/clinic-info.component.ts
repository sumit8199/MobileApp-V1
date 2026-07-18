import { CommonModule } from '@angular/common';
import { Component, input, OnInit } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { pinOutline, callOutline, documentTextOutline } from 'ionicons/icons';

interface DoctorInfo {
  clinic: string;
  phone: string;
  registration: string;
}

@Component({
  selector: 'app-clinic-info',
  templateUrl: './clinic-info.component.html',
  styleUrls: ['./clinic-info.component.scss'],
  standalone: true,
  imports: [IonIcon, CommonModule, ]
})
export class ClinicInfoComponent  implements OnInit {

  readonly doctor = input.required<DoctorInfo>();
  constructor() {
    addIcons({
      'pin-outline': pinOutline,
      'call-outline': callOutline,
      'document-text-outline': documentTextOutline
    });
   }

  ngOnInit() {}

}
