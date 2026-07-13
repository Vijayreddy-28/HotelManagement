import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HousekeepingLayoutComponent } from './housekeeping-layout-component';

describe('HousekeepingLayoutComponent', () => {
  let component: HousekeepingLayoutComponent;
  let fixture: ComponentFixture<HousekeepingLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HousekeepingLayoutComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HousekeepingLayoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
