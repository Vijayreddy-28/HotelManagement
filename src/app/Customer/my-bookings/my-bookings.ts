import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RoomBookingService } from '../../../services/roombooking.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-bookings.html',
  styleUrl: './my-bookings.css'
})
export class MyBookingsComponent implements OnInit {
  bookings = signal<any[]>([]);
  loading = signal<boolean>(true);

  // Modal states
  selectedBookingRooms = signal<any[]>([]);
  showRoomsModal = signal<boolean>(false);
  loadingRooms = signal<boolean>(false);
  activeBookingId = signal<number | null>(null);

  constructor(
    private roomBookingService: RoomBookingService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading.set(true);
    // Call getMyBookingDetails() which queries api/RoomBooking/my
    this.roomBookingService.getMyBookingDetails().subscribe({
      next: (res: any) => {
        console.log('Bookings loaded:', res);
        this.bookings.set(res || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 404) {
          this.bookings.set([]);
          return;
        }
        this.toastr.error(err.error?.message || 'Unable to load bookings.', 'API Error');
      }
    });
  }

  viewRooms(bookingId: number): void {
    this.activeBookingId.set(bookingId);
    this.loadingRooms.set(true);
    this.showRoomsModal.set(true);

    this.roomBookingService.getBookingRooms(bookingId).subscribe({
      next: (res: any) => {
        this.selectedBookingRooms.set(res || []);
        this.loadingRooms.set(false);
      },
      error: (err) => {
        this.loadingRooms.set(false);
        this.showRoomsModal.set(false);
        this.toastr.error(err.error?.message || 'Unable to load rooms for this booking.', 'API Error');
      }
    });
  }

  closeRoomsModal(): void {
    this.showRoomsModal.set(false);
    this.selectedBookingRooms.set([]);
    this.activeBookingId.set(null);
  }
}
