export class RoomRequest {
  constructor(
    public checkIn: string,
    public checkOut: string,
    public Page: number,
    public PageSize: number,
  ) {}
}
