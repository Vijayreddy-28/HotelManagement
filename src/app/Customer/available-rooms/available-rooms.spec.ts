import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvailableRooms } from './available-rooms';

describe('AvailableRooms', () => {
  let component: AvailableRooms;
  let fixture: ComponentFixture<AvailableRooms>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvailableRooms],
    }).compileComponents();

    fixture = TestBed.createComponent(AvailableRooms);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
