import { CommonModule } from '@angular/common';
import { Component, input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonIcon } from "@ionic/angular/standalone";

@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.scss'],
  imports: [IonIcon, CommonModule, FormsModule],
  standalone: true,
})
export class StatCardComponent  implements OnInit {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly icon = input.required<string>(); // Passing icon name as string for Angular/Ionic
  readonly gold = input<boolean>(false);

  constructor() { }

  ngOnInit() {}

}
