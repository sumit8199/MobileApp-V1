import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PatientCardComponent } from './patient-card.component';

describe('PatientCardComponent', () => {
  let component: PatientCardComponent;
  let fixture: ComponentFixture<PatientCardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PatientCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
