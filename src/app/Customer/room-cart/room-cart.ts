import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartService } from '../../../services/cart.service';
import { RoomBookingService } from '../../../services/roombooking.service';
import { RoomBooking } from '../../../models/roombooking.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-room-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './room-cart.html',
  styleUrl: './room-cart.css',
})
export class RoomCartComponent implements OnInit {
  bookingForm!: FormGroup;

  constructor(
    public cartService: CartService,
    private roomBookingService: RoomBookingService,
    private fb: FormBuilder,
    private router: Router
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
      Swal.fire({
        icon: 'error',
        title: 'Invalid Details',
        text: 'Please check that all booking dates and guest details are valid.',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    const rooms = this.cartService.cartRooms();
    if (rooms.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Empty Cart',
        text: 'Please add at least one room to your cart before booking.',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    const nights = this.getNightsCount();
    if (nights <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Dates',
        text: 'Check-out date must be after the check-in date.',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    const checkIn = this.bookingForm.value.checkIn;
    const checkOut = this.bookingForm.value.checkOut;
    const numberOfGuests = parseInt(this.bookingForm.value.numberOfGuests, 10);
    const roomIds = rooms.map(r => r.roomId);

    const bookingRequest = new RoomBooking(
      checkIn,
      checkOut,
      numberOfGuests,
      roomIds
    );

    Swal.fire({
      title: 'Confirm Booking',
      text: `Are you sure you want to book ${rooms.length} room(s) for ${nights} night(s)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Confirm Booking',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Processing...',
          text: 'Placing your room booking',
          timer: 2000,
          timerProgressBar: true,
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this.roomBookingService.roomBookingCall(bookingRequest).subscribe({
          next: (response: any) => {
            if (Number(response.statusCode) == 400 || Number(response.statusCode) == 401) {
              Swal.fire({
                icon: 'error',
                title: 'Booking Failed',
                text: response.message || 'An error occurred while placing your booking. Please try again.',
                confirmButtonText: 'OK',
                confirmButtonColor: '#2563eb',
              });
              return;
            }
            Swal.fire({
              icon: 'success',
              title: 'Booking Confirmed!',
              text: response.message || 'Your room booking has been successfully processed.',
              confirmButtonText: 'Great!',
              confirmButtonColor: '#2563eb',
            }).then(() => {
              this.cartService.clearCart();
              this.router.navigate(['/customer/rooms']);
            });
          },
          error: (err: any) => {
            Swal.fire({
              icon: 'error',
              title: 'Booking Failed',
              text: err.error?.message || err.message || 'An error occurred while placing your booking. Please try again.',
              confirmButtonText: 'OK',
              confirmButtonColor: '#2563eb',
            });
          }
        });
      }
    });
  }
}
