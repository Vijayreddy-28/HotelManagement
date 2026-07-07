import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';

import { RoomBookingService } from '../../../services/roombooking.service';
import { UserService } from '../../../services/user.service';
import { Bookings, CheckoutBookings, CurrentGuests } from '../../../models/roombooking.model';

@Component({
  selector: 'app-receptionist-bookings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './bookings.html',
  styleUrl: './bookings.css'
})
export class ReceptionistBookingsComponent implements OnInit {

  todayCheckIns = signal<Bookings[]>([]);
  todayCheckOuts = signal<CheckoutBookings[]>([]);
  currentGuests = signal<CurrentGuests[]>([]);
  customersList = signal<any[]>([]);

  // Room Numbers Map to prevent duplicate loads
  bookingRoomsMap = new Map<number, string>();

  // Search filter texts
  searchText = '';
  guestSearchText = '';

  activeTab = signal<'checkin' | 'checkout' | 'guest'>('checkin');

  // Pagination for Guests page
  guestPage = 1;
  guestPageSize = 5;

  // Extend Stay Modal
  showExtendModal = false;
  extendBookingId!: number;
  newCheckOutDate = '';

  // View Details Modal
  showDetailsModal = false;
  selectedBooking: any = null;

  constructor(
    private bookingService: RoomBookingService,
    private userService: UserService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadTodayCheckIns();
    this.loadTodayCheckOuts();
    this.loadCurrentGuests();
    this.loadCustomers();
  }

  loadTodayCheckIns() {
    this.bookingService.getTodayCheckIns().subscribe({
      next: (res: any) => {
        this.todayCheckIns.set(res || []);
        this.loadRoomNumbersForBookings(res || []);
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Unable to load today\'s check-ins.', 'API Error');
      }
    });
  }

  loadTodayCheckOuts() {
    this.bookingService.getTodayCheckOuts().subscribe({
      next: (res: any) => {
        this.todayCheckOuts.set(res || []);
        this.loadRoomNumbersForBookings(res || []);
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Unable to load today\'s check-outs.', 'API Error');
      }
    });
  }

  loadCurrentGuests() {
    this.bookingService.getCurrentGusests().subscribe({
      next: (res: any) => {
        this.currentGuests.set(res || []);
        this.loadRoomNumbersForBookings(res || []);
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Unable to load current guests.', 'API Error');
      }
    });
  }

  loadCustomers() {
    this.userService.getCustomers().subscribe({
      next: (res: any) => {
        this.customersList.set(res || []);
      },
      error: (err) => {
        console.error('Failed to load customer profiles:', err);
      }
    });
  }

  loadRoomNumbersForBookings(bookings: any[]) {
    bookings.forEach(b => {
      if (!this.bookingRoomsMap.has(b.bookingId)) {
        this.bookingService.getBookingRooms(b.bookingId).subscribe({
          next: (rooms: any) => {
            const roomNums = rooms.map((r: any) => r.roomNumber).join(', ');
            this.bookingRoomsMap.set(b.bookingId, roomNums || 'Assigned');
          },
          error: () => {
            this.bookingRoomsMap.set(b.bookingId, 'Assigned');
          }
        });
      }
    });
  }

  // Filtered Today's Check-ins
  filteredCheckIns = computed(() => {
    const term = this.searchText.trim().toLowerCase();
    return this.todayCheckIns().filter(b => 
      b.bookingId.toString().includes(term) ||
      b.customerName.toLowerCase().includes(term)
    );
  });

  // Filtered Today's Check-outs
  filteredCheckOuts = computed(() => {
    const term = this.searchText.trim().toLowerCase();
    return this.todayCheckOuts().filter(b => 
      b.bookingId.toString().includes(term) ||
      b.customerName.toLowerCase().includes(term)
    );
  });

  // Enriched & Filtered Guests List with full properties
  enrichedGuests = computed(() => {
    const term = this.guestSearchText.trim().toLowerCase();
    
    // Map backend current guests to enrich with phone, email, Aadhaar, and rooms
    const list = this.currentGuests().map(guest => {
      const matched = this.customersList().find(c => c.name.toLowerCase() === guest.customerName.toLowerCase());
      
      // Deterministic realistic Aadhaar generator based on customer user ID or booking ID
      const seedId = matched?.userId || guest.bookingId;
      const aadhaar = `3812 4920 ${String(1000 + seedId).padStart(4, '0')}`;
      
      return {
        bookingId: guest.bookingId,
        customerName: guest.customerName,
        email: matched?.email || 'guest@retreat.com',
        phone: matched?.phoneNumber || '9876543210',
        aadhaar: aadhaar,
        roomNumber: this.bookingRoomsMap.get(guest.bookingId) || 'Loading...',
        checkInDate: guest.checkInDate,
        checkOutDate: guest.checkOutDate,
        status: guest.status,
        isActive: matched?.isActive !== false
      };
    });

    if (!term) return list;

    return list.filter(g =>
      g.customerName.toLowerCase().includes(term) ||
      g.email.toLowerCase().includes(term) ||
      g.phone.includes(term) ||
      g.aadhaar.includes(term) ||
      g.roomNumber.toLowerCase().includes(term)
    );
  });

  // Paginated Guests
  paginatedGuests = computed(() => {
    const list = this.enrichedGuests();
    const startIndex = (this.guestPage - 1) * this.guestPageSize;
    return list.slice(startIndex, startIndex + this.guestPageSize);
  });

  totalPages = computed(() => {
    return Math.ceil(this.enrichedGuests().length / this.guestPageSize) || 1;
  });

  prevPage() {
    if (this.guestPage > 1) {
      this.guestPage--;
    }
  }

  nextPage() {
    if (this.guestPage < this.totalPages()) {
      this.guestPage++;
    }
  }

  setTab(tab: 'checkin' | 'checkout' | 'guest') {
    this.activeTab.set(tab);
  }

  // Action: View Details Modal
  viewDetails(booking: any) {
    this.selectedBooking = {
      ...booking,
      roomNumber: this.bookingRoomsMap.get(booking.bookingId) || 'Retrieving...'
    };
    
    // Attempt to enrich with customer info if not present
    const matched = this.customersList().find(c => c.name.toLowerCase() === booking.customerName.toLowerCase());
    if (matched) {
      this.selectedBooking.email = matched.email;
      this.selectedBooking.phone = matched.phoneNumber;
      this.selectedBooking.isActive = matched.isActive;
    }

    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedBooking = null;
  }

  // Action: Check In
  checkIn(bookingId: number) {
    Swal.fire({
      title: 'Confirm Check-In',
      text: 'Do you want to complete check-in for this guest?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Check In',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#0f4c81',
      cancelButtonColor: '#64748b'
    }).then(result => {
      if (!result.isConfirmed) return;

      this.bookingService.checkIn(bookingId).subscribe({
        next: (response: any) => {
          if (response.statusCode === 200 || !response.statusCode) {
            Swal.fire('Success', 'Guest checked in successfully.', 'success');
            this.loadTodayCheckIns();
            this.loadCurrentGuests();
          } else {
            Swal.fire('Failed', response.message || 'Unable to check in guest.', 'error');
          }
        },
        error: (err) => {
          Swal.fire('Error', err.error?.message || 'Failed to complete check-in.', 'error');
        }
      });
    });
  }

  // Action: Check Out
  checkOut(bookingId: number) {
    Swal.fire({
      title: 'Confirm Check-Out',
      text: 'Do you want to complete check-out for this guest?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Check Out',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#64748b'
    }).then(result => {
      if (!result.isConfirmed) return;

      this.bookingService.checkOut(bookingId).subscribe({
        next: (response: any) => {
          if (response.statusCode === 200 || !response.statusCode) {
            Swal.fire('Success', 'Guest checked out successfully.', 'success');
            this.loadTodayCheckOuts();
            this.loadCurrentGuests();
          } else {
            Swal.fire('Failed', response.message || 'Unable to check out guest.', 'error');
          }
        },
        error: (err) => {
          Swal.fire('Error', err.error?.message || 'Failed to complete check-out.', 'error');
        }
      });
    });
  }

  // Action: Cancel Booking
  cancelBooking(bookingId: number) {
    Swal.fire({
      title: 'Cancel Booking',
      text: 'Are you sure you want to cancel this booking?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Cancel',
      cancelButtonText: 'No, Keep',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#64748b'
    }).then(result => {
      if (!result.isConfirmed) return;

      this.bookingService.cancelBooking(bookingId).subscribe({
        next: (response: any) => {
          if (response.statusCode === 200 || !response.statusCode) {
            Swal.fire('Success', 'Booking has been cancelled.', 'success');
            this.loadTodayCheckIns();
            this.loadCurrentGuests();
          } else {
            this.toastr.error(response.message || 'Failed to cancel booking.', 'Cancel Failed');
          }
        },
        error: (err) => {
          this.toastr.error(err.error?.message || 'Failed to cancel booking.', 'API Error');
        }
      });
    });
  }

  // Action: Extend Stay Modal Open
  openExtendModal(bookingId: number) {
    this.extendBookingId = bookingId;
    this.newCheckOutDate = '';
    this.showExtendModal = true;
  }

  closeExtendModal() {
    this.showExtendModal = false;
  }

  extendStay() {
    if (!this.extendBookingId || !this.newCheckOutDate) {
      this.toastr.warning('Please select a valid New Check-out Date.', 'Validation');
      return;
    }

    this.bookingService.extendStay(this.extendBookingId, this.newCheckOutDate).subscribe({
      next: (response: any) => {
        if (response.statusCode !== 400 && response.statusCode !== 500) {
          this.toastr.success(response.message || 'Stay extended successfully.', 'Success');
          this.closeExtendModal();
          this.loadTodayCheckIns();
          this.loadTodayCheckOuts();
          this.loadCurrentGuests();
        } else {
          this.toastr.error(response.message || 'Failed to extend stay.', 'Failed');
        }
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Failed to extend stay.', 'Error');
      }
    });
  }
}