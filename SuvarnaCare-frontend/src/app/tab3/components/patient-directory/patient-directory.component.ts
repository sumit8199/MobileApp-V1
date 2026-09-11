import { Component, input, OnInit, output, computed } from '@angular/core';
import { addIcons } from 'ionicons';
import {
  addOutline,
  closeCircleOutline,
  peopleOutline,
  searchOutline,
  reloadOutline,
  chevronBackOutline,
  chevronForwardOutline,
  createOutline,
  trashOutline,
} from 'ionicons/icons';
import { IonIcon } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { PatientCardComponent } from '../patient-card/patient-card.component';
import { FormsModule } from '@angular/forms';
import { Patient } from '@core/interfaces';

@Component({
  selector: 'app-patient-directory',
  templateUrl: './patient-directory.component.html',
  styleUrls: ['./patient-directory.component.scss'],
  standalone: true,
  imports: [IonIcon, CommonModule, PatientCardComponent, FormsModule],
})
export class PatientDirectoryComponent implements OnInit {
  readonly patients = input.required<Patient[]>();
  readonly totalCount = input.required<number>();
  readonly nextPushya = input.required<string>();
  readonly search = input<string>('');
  readonly currentPage = input<number>(1);
  readonly pageSize = input<number>(5);
  readonly totalPages = input<number>(1);

  // Event emitters to notify parent page
  readonly searchChange = output<string>();
  readonly pageChange = output<number>();
  readonly openAddForm = output<void>();
  readonly editPatient = output<Patient>();
  readonly deletePatient = output<string>();

  public startIndex = computed(() =>
    this.totalCount() === 0
      ? 0
      : (this.currentPage() - 1) * this.pageSize() + 1
  );

  public endIndex = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.totalCount())
  );

  public pagesArray = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  constructor() {
    addIcons({
      addOutline,
      searchOutline,
      closeCircleOutline,
      peopleOutline,
      reloadOutline,
      chevronBackOutline,
      chevronForwardOutline,
      createOutline,
      trashOutline,
    });
  }

  ngOnInit() {}

  public onInput(query: string): void {
    this.searchChange.emit(query);
  }

  public clearSearch(): void {
    this.searchChange.emit('');
  }

  public onEdit(patient: Patient): void {
    this.editPatient.emit(patient);
  }

  public onDelete(patientId: string): void {
    this.deletePatient.emit(patientId);
  }

  public goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.pageChange.emit(page);
    }
  }

  public nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.pageChange.emit(this.currentPage() + 1);
    }
  }

  public prevPage(): void {
    if (this.currentPage() > 1) {
      this.pageChange.emit(this.currentPage() - 1);
    }
  }

  public formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  }
}
