import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartService } from '../../../services/cart.service';
import { RoomBookingService } from '../../../services/roombooking.service';
import { RoomBooking } from '../../../models/roombooking.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-room-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './room-cart.html',
  styleUrl: './room-cart.css',
})
export class RoomCartComponent implements OnInit {
  bookingForm!: FormGroup;
  showConfirmModal = false;
  pendingBookingRequest: RoomBooking | null = null;

  constructor(
    public cartService: CartService,
    private roomBookingService: RoomBookingService,
    private fb: FormBuilder,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit() {
    this.bookingForm = this.fb.group({
      checkIn: [this.cartService.checkIn(), Validators.required],
      checkOut: [this.cartService.checkOut(), Validators.required],
      numberOfGuests: [this.cartService.numberOfGuests() || 1, [Validators.required, Validators.min(1)]],
    });

    this.bookingForm.valueChanges.subscribe((value) => {
      this.cartService.setDates(value.checkIn || '', value.checkOut || '');
      if (value.numberOfGuests && value.numberOfGuests >= 1) {
        this.cartService.setNumberOfGuests(value.numberOfGuests);
      }
    });
  }

  removeFromCart(roomId: number) {
    this.cartService.removeFromCart(roomId);
  }

  getTotalPricePerNight(): number {
    return this.cartService.cartRooms().reduce((total, room) => total + room.pricePerNight, 0);
  }

  getNightsCount(): number {
    const checkInVal = this.bookingForm?.value?.checkIn;
    const checkOutVal = this.bookingForm?.value?.checkOut;
    if (!checkInVal || !checkOutVal) return 0;

    const start = new Date(checkInVal);
    const end = new Date(checkOutVal);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const timeDiff = end.getTime() - start.getTime();
    if (timeDiff <= 0) return 0;

    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  getTotalAmount(): number {
    const nights = this.getNightsCount();
    const pricePerNight = this.getTotalPricePerNight();
    return pricePerNight * (nights || 1);
  }

  confirmBooking() {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      this.toastr.error('Please check that all booking dates and guest details are valid.', 'Invalid Details');
      return;
    }

    const rooms = this.cartService.cartRooms();
    if (rooms.length === 0) {
      this.toastr.warning('Please add at least one room to your cart before booking.', 'Empty Cart');
      return;
    }

    const nights = this.getNightsCount();
    if (nights <= 0) {
      this.toastr.warning('Check-out date must be after the check-in date.', 'Invalid Dates');
      return;
    }

    const checkIn = this.bookingForm.value.checkIn;
    const checkOut = this.bookingForm.value.checkOut;
    const numberOfGuests = parseInt(this.bookingForm.value.numberOfGuests, 10);
    const roomIds = rooms.map(r => r.roomId);

    this.pendingBookingRequest = new RoomBooking(
      checkIn,
      checkOut,
      numberOfGuests,
      roomIds
    );

    this.showConfirmModal = true;
  }

  cancelBooking() {
    this.showConfirmModal = false;
    this.pendingBookingRequest = null;
  }

  executeBooking() {
    if (!this.pendingBookingRequest) return;
    this.showConfirmModal = false;

    this.toastr.info('Placing your room booking...', 'Processing');

    this.roomBookingService.roomBookingCall(this.pendingBookingRequest).subscribe({
      next: (response: any) => {
        if (Number(response.statusCode) == 400 || Number(response.statusCode) == 401) {
          this.toastr.error(response.message || 'An error occurred while placing your booking. Please try again.', 'Booking Failed');
          return;
        }
        this.toastr.success(response.message || 'Your room booking has been successfully processed.', 'Booking Confirmed!');
        this.cartService.clearCart();
        this.router.navigate(['/customer/rooms']);
      },
      error: (err: any) => {
        this.toastr.error(err.error?.message || err.message || 'An error occurred while placing your booking. Please try again.', 'Booking Failed');
      }
    });
  }
}
