import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PatientDirectoryComponent } from './patient-directory.component';

describe('PatientDirectoryComponent', () => {
  let component: PatientDirectoryComponent;
  let fixture: ComponentFixture<PatientDirectoryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PatientDirectoryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientDirectoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
