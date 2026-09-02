import { Component, input, OnInit, output, signal, computed } from '@angular/core';
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
  readonly allCount = input.required<number>();
  readonly nextPushya = input.required<string>();
  readonly search = input<string>('');

  // Event emitters to notify parent page
  readonly searchChange = output<string>();
  readonly openAddForm = output<void>();
  readonly editPatient = output<Patient>();
  readonly deletePatient = output<string>();

  // Pagination state
  public currentPage = signal<number>(1);
  public pageSize = signal<number>(5);

  public totalPages = computed(() =>
    Math.ceil(this.patients().length / this.pageSize()) || 1
  );

  public pagedPatients = computed(() => {
    const list = this.patients();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  public startIndex = computed(() =>
    this.patients().length === 0
      ? 0
      : (this.currentPage() - 1) * this.pageSize() + 1
  );

  public endIndex = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.patients().length)
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
    this.currentPage.set(1);
    this.searchChange.emit(query);
  }

  public clearSearch(): void {
    this.currentPage.set(1);
    this.searchChange.emit('');
  }

  public onEdit(patient: Patient): void {
    this.editPatient.emit(patient);
  }

  public onDelete(patientId: string): void {
    this.deletePatient.emit(patientId);
  }

  public goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  public nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
    }
  }

  public prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
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
