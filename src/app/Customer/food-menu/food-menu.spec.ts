import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FoodMenuComponent } from './food-menu';

describe('FoodMenuComponent', () => {
  let component: FoodMenuComponent;
  let fixture: ComponentFixture<FoodMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FoodMenuComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FoodMenuComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
