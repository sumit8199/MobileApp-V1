import { CommonModule } from '@angular/common';
import { Component, input, OnInit, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  close, calendarOutline
} from 'ionicons/icons';
@Component({
  selector: 'app-calender-details',
  templateUrl: './calender-details.component.html',
  styleUrls: ['./calender-details.component.scss'],
  standalone: true,
  imports: [IonIcon, CommonModule]
})
export class CalenderDetailsComponent  implements OnInit {
  readonly selectedDate = input<string | null>(null);
  readonly isSelectedPushya = input(false);
  readonly isSelectedPast = input(false);
  readonly patients = input<any[]>([]);

  readonly GREEN = '#1A4329';
  readonly GOLD = '#D4AF37';

  readonly close = output<void>();

  formatDate(date: string | null) {
    return date ?? '';
  }

  onClose() {
    this.close.emit();
  }
  constructor() { 
    addIcons({ close , calendarOutline})
  }

  ngOnInit() {}

}
