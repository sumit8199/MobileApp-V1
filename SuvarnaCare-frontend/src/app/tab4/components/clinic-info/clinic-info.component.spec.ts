import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ClinicInfoComponent } from './clinic-info.component';

describe('ClinicInfoComponent', () => {
  let component: ClinicInfoComponent;
  let fixture: ComponentFixture<ClinicInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ClinicInfoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClinicInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
