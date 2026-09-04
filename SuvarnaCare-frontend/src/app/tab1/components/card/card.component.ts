import { CommonModule } from '@angular/common';
import { Component, input, OnInit } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';

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

  constructor() {}

  ngOnInit() {}
}
