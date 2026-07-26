import { CommonModule } from '@angular/common';
import { Component, input, OnInit } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  flash
} from 'ionicons/icons';

@Component({
  selector: 'app-schedule-section',
  templateUrl: './schedule-section.component.html',
  styleUrls: ['./schedule-section.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon],
})
export class ScheduleSectionComponent implements OnInit {
  readonly stage = input<1 | 2>(1);
  readonly label = input('');
  readonly fireDate = input('');
  readonly pushyaDate = input('');
  readonly patients = input<any[]>([]);

  readonly GREEN = '#1A4329';
  readonly GREEN_LIGHT = '#EAF5ED';
  readonly GOLD = '#D4AF37';

  get isStage1() {
    return this.stage() === 1;
  }

  get stageKey() {
    return this.isStage1 ? 'stage1Status' : 'stage2Status';
  }

  get atKey() {
    return this.isStage1 ? 'stage1At' : 'stage2At';
  }

  formatDate(date: string) {
    // your existing function
    return date;
  }
  constructor() {
    addIcons({flash})
  }

  ngOnInit() {}
}
