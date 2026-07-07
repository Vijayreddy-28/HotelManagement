import { FoodMenu } from './foodmenu.model';

export class FoodOrder {
  constructor(
    public bookingId: number,
    public roomId: number,
    public items: FoodMenu[],
  ) {}
}
