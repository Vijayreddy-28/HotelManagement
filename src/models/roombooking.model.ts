export class RoomBooking {
  constructor(
    public checkIn: string,
    public checkOut: string,
    public numberOfGuests: number,
    public roomIds: number[],
  ) { }
}

export class Bookings {
  constructor(public bookingId: number,
    public customerName: string,
    public checkInDate: string,
    public totalAmount: number,
    public status: string) { }
}

export class CurrentGuests {
  constructor(public bookingId: number,
    public customerName: string,
    public checkInDate: string,
    public checkOutDate: string,
    public totalAmount: number,
    public status: string) {

  }
}

export class CheckoutBookings {
  constructor(public bookingId: number,
    public customerName: string,
    public checkOutDate: string,
    public totalAmount: number,
    public status: string) { }
}