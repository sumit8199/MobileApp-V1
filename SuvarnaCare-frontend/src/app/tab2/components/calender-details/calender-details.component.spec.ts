import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CalenderDetailsComponent } from './calender-details.component';

describe('CalenderDetailsComponent', () => {
  let component: CalenderDetailsComponent;
  let fixture: ComponentFixture<CalenderDetailsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CalenderDetailsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CalenderDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
