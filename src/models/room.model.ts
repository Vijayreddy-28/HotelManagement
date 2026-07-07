export class Room {
  constructor(
    public roomId: number,
    public roomNumber: string,
    public typeName: string,
    public floor: number,
    public pricePerNight: number,
    public noOfBeds: number,
    public maxOccupancy: number,
    public status: string,
    public isActive: boolean,
  ) { }
}

export class CurrentRooms {
  constructor(public bookingId: number,
    public roomId: number,
    public roomNumber: number
  ) { }
}