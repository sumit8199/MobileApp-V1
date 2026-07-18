import { Component, OnInit } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { leafOutline } from 'ionicons/icons';

@Component({
  selector: 'app-app-info',
  templateUrl: './app-info.component.html',
  styleUrls: ['./app-info.component.scss'],
  standalone: true,
  imports: [IonIcon]
})
export class AppInfoComponent  implements OnInit {

  constructor() { 
    addIcons({
      'leaf-outline': leafOutline
    });
  }

  ngOnInit() {}

}
