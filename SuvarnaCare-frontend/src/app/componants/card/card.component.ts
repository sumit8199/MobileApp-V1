import { CommonModule } from '@angular/common';
import { Component, input, OnInit } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { Icon } from 'ionicons/dist/types/components/icon/icon';
import { apps, calendarClear, peopleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-card',
  standalone: true,
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  imports: [IonIcon, CommonModule],
})
export class CardComponent implements OnInit {
  readonly label = input<string>('');
  readonly value = input<string | number>('');
  readonly gold = input<boolean>(false);
  readonly icon = input<string>('');


  readonly GREEN = '#1A4329';
  readonly GREEN_LIGHT = '#EAF5ED';
  readonly GOLD = '#D4AF37';
  constructor() {}

  ngOnInit() {}
}
