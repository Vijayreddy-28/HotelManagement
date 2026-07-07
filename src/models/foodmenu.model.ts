export enum FoodCategory {
  Breakfast = 1,
  MainCourse = 2,
  Snacks = 3,
  Dessert = 4,
  Beverage = 5,
  Starter = 6,
}

export class FoodMenu {
  constructor(
    public itemId: number,
    public itemName: string,
    public category: string,
    public price: number,
    public imageUrl: string,
    public description?: string,
    public isVeg?: boolean,
    public isAvailable?: boolean,
  ) {}
}
