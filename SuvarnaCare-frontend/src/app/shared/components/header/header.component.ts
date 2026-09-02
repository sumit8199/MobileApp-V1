import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonHeader,
  IonIcon,
  IonToolbar,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  leafOutline,
  notificationsOutline,
  serverOutline,
  logOutOutline,
  personCircleOutline,
} from 'ionicons/icons';
import { MenuController } from '@ionic/angular';
import { SqlConnectionService, AuthService } from '@core/services';

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
  private menuCtrl = inject(MenuController);
  private sqlConnectionService = inject(SqlConnectionService);
  public authService = inject(AuthService);
  private alertCtrl = inject(AlertController);
  private router = inject(Router);

  public dbStatus = this.sqlConnectionService.connectionStatus;
  public currentUser = this.authService.currentUser;

  constructor() {
    addIcons({
      leafOutline,
      notificationsOutline,
      serverOutline,
      logOutOutline,
      personCircleOutline,
    });
  }

  ngOnInit(): void {
    this.sqlConnectionService.checkConnections().subscribe();
  }

  openMenu(): void {
    this.menuCtrl.open('main-menu');
  }

  navigateToSettings(): void {
    this.router.navigate(['/tabs/tab4']);
  }

  async logout(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Sign Out',
      message: 'Do you want to sign out of SuvarnaCare?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Sign Out',
          role: 'destructive',
          handler: () => {
            this.authService.logout();
          },
        },
      ],
    });
    await alert.present();
  }
}
