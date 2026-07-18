import { Component, computed, input, OnInit, signal } from '@angular/core';
import { Patient } from '../patient-directory/patient-directory.component';
import { addIcons } from 'ionicons';
import { chevronForwardOutline, flashOutline, timeOutline } from 'ionicons/icons';
import { IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-patient-card',
  templateUrl: './patient-card.component.html',
  styleUrls: ['./patient-card.component.scss'],
  standalone: true,
  imports: [IonIcon]
})
export class PatientCardComponent implements OnInit {
  readonly patient = input.required<Patient>();
  readonly nextPushya = input.required<string>();

  // Local state managing expand state transitions
  public expanded = signal<boolean>(false);

  // Computed keys logic derived cleanly from dynamic changes
  readonly sessionDates = computed(() =>
    Object.keys(this.patient().history).sort(),
  );
  readonly nextRecord = computed(
    () => this.patient().history[this.nextPushya()],
  );
  constructor() { 
    addIcons({
      chevronForwardOutline,
      timeOutline,
      flashOutline
    });
  }

  ngOnInit() {}

  public toggleExpand(): void {
    this.expanded.update(v => !v);
  }

  public isPast(dateStr: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr) < today;
  }

  public formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  }
}
