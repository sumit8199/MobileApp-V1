import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  IonButton,
  IonHeader,
  IonIcon,
  IonMenuToggle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { leafOutline, notificationsOutline } from 'ionicons/icons';
import { MenuController } from '@ionic/angular';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonIcon,
    IonHeader,
    IonToolbar,
    IonButton,
  ],
})
export class HeaderComponent implements OnInit {
  constructor(private menuCtrl: MenuController) {
    addIcons({ leafOutline, notificationsOutline });
  }

  ngOnInit() {}

  openMenu() {
    this.menuCtrl.open('main-menu');
  }
}
