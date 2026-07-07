export enum ActivityType {
  Booking = 0,
  CheckIn = 1,
  CheckOut = 2,
  Payment = 3,
  FoodOrder = 4,
  Housekeeping = 5,
  Room = 6,
  User = 7
}

export class ActivityLogResponse {
  constructor(
    public activityLogId: number,
    public title: string,
    public description: string,
    public activityType: ActivityType,
    public createdAt: string
  ) {}
}
