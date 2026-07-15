import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
  loading = signal<boolean>(true);

  totalCheckInsCount = signal<number>(0);
  totalCheckOutsCount = signal<number>(0);
  totalGuestsCount = signal<number>(0);

  totalCheckInPages = signal<number>(1);
  totalCheckOutPages = signal<number>(1);
  totalPages = signal<number>(1); // for guests

  // Room Numbers Map to prevent duplicate loads
  bookingRoomsMap = signal<Map<number, string>>(new Map());

  // Search filter texts
  searchText = '';
  guestSearchText = '';

  activeTab = signal<'checkin' | 'checkout' | 'guest'>('checkin');

  // Pagination for Guests page
  private _guestPage = signal<number>(1);
  get guestPage(): number { return this._guestPage(); }
  set guestPage(val: number) { this._guestPage.set(val); }
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
    this.loadAllData();
  }

  goToBilling(): void {
    this.router.navigate(['/receptionist/billing']);
  }

  loadAllData() {
    this.loading.set(true);
    import('rxjs').then(({ forkJoin }) => {
      forkJoin([
        this.bookingService.getTodayCheckIns(this.checkInPage, this.checkInPageSize),
        this.bookingService.getTodayCheckOuts(this.checkOutPage, this.checkOutPageSize),
        this.bookingService.getCurrentGusests(this.guestPage, this.guestPageSize),
        this.userService.getCustomers()
      ]).subscribe({
        next: ([checkins, checkouts, guests, customers]: [any, any, any, any]) => {
          const checkinsArray = checkins?.data || [];
          this.todayCheckIns.set(checkinsArray);
          this.totalCheckInsCount.set(checkins?.totalRecords || checkinsArray.length);
          this.totalCheckInPages.set(checkins?.totalPages || 1);
          this.loadRoomNumbersForBookings(checkinsArray);

          const checkoutsArray = checkouts?.data || [];
          this.todayCheckOuts.set(checkoutsArray);
          this.totalCheckOutsCount.set(checkouts?.totalRecords || checkoutsArray.length);
          this.totalCheckOutPages.set(checkouts?.totalPages || 1);
          this.loadRoomNumbersForBookings(checkoutsArray);

          const guestsArray = guests?.data || [];
          this.currentGuests.set(guestsArray);
          this.totalGuestsCount.set(guests?.totalRecords || guestsArray.length);
          this.totalPages.set(guests?.totalPages || 1);
          this.loadRoomNumbersForBookings(guestsArray);

          const customersArray = Array.isArray(customers) ? customers : (customers?.data || customers?.customers || []);
          this.customersList.set(customersArray);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.toastr.error('Failed to load bookings database.', 'API Error');
        }
      });
    });
  }

  loadTodayCheckIns() {
    this.loading.set(true);
    this.bookingService.getTodayCheckIns(this.checkInPage, this.checkInPageSize).subscribe({
      next: (res: any) => {
        const checkinsArray = res?.data || [];
        this.todayCheckIns.set(checkinsArray);
        this.totalCheckInsCount.set(res?.totalRecords || checkinsArray.length);
        this.totalCheckInPages.set(res?.totalPages || 1);
        this.loadRoomNumbersForBookings(checkinsArray);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toastr.error(err.error?.message || 'Unable to load today\'s check-ins.', 'API Error');
      }
    });
  }

  loadTodayCheckOuts() {
    this.loading.set(true);
    this.bookingService.getTodayCheckOuts(this.checkOutPage, this.checkOutPageSize).subscribe({
      next: (res: any) => {
        const checkoutsArray = res?.data || [];
        this.todayCheckOuts.set(checkoutsArray);
        this.totalCheckOutsCount.set(res?.totalRecords || checkoutsArray.length);
        this.totalCheckOutPages.set(res?.totalPages || 1);
        this.loadRoomNumbersForBookings(checkoutsArray);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toastr.error(err.error?.message || 'Unable to load today\'s check-outs.', 'API Error');
      }
    });
  }

  loadCurrentGuests() {
    this.loading.set(true);
    this.bookingService.getCurrentGusests(this.guestPage, this.guestPageSize).subscribe({
      next: (res: any) => {
        const guestsArray = res?.data || [];
        this.currentGuests.set(guestsArray);
        this.totalGuestsCount.set(res?.totalRecords || guestsArray.length);
        this.totalPages.set(res?.totalPages || 1);
        this.loadRoomNumbersForBookings(guestsArray);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toastr.error(err.error?.message || 'Unable to load current guests.', 'API Error');
      }
    });
  }

  loadCustomers() {
    this.loading.set(true);
    this.userService.getCustomers().subscribe({
      next: (res: any) => {
        const customersArray = Array.isArray(res) ? res : (res?.data || res?.customers || []);
        this.customersList.set(customersArray);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Failed to load customer profiles:', err);
      }
    });
  }

  loadRoomNumbersForBookings(bookings: any[]) {
    const list = Array.isArray(bookings) ? bookings : [];
    list.forEach(b => {
      if (b && b.bookingId && !this.bookingRoomsMap().has(b.bookingId)) {
        this.bookingService.getBookingRooms(b.bookingId).subscribe({
          next: (rooms: any) => {
            const roomsArray = Array.isArray(rooms) ? rooms : (rooms?.data || rooms || []);
            const roomNums = roomsArray.map((r: any) => r.roomNumber).join(', ');
            this.bookingRoomsMap.update(map => {
              map.set(b.bookingId, roomNums || 'Assigned');
              return new Map(map);
            });
          },
          error: () => {
            this.bookingRoomsMap.update(map => {
              map.set(b.bookingId, 'Assigned');
              return new Map(map);
            });
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
      const aadhaar = matched?.adhaarNumber || '';

      return {
        bookingId: guest.bookingId,
        customerName: guest.customerName,
        email: matched?.email || 'guest@retreat.com',
        phone: matched?.phoneNumber || '9876543210',
        adhaarNumber: aadhaar,
        roomNumber: this.bookingRoomsMap().get(guest.bookingId) || 'Loading...',
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
      g.adhaarNumber.includes(term) ||
      g.roomNumber.toLowerCase().includes(term)
    );
  });

  // Pagination parameters
  private _checkInPage = signal<number>(1);
  get checkInPage(): number { return this._checkInPage(); }
  set checkInPage(val: number) { this._checkInPage.set(val); }
  checkInPageSize = 5;

  private _checkOutPage = signal<number>(1);
  get checkOutPage(): number { return this._checkOutPage(); }
  set checkOutPage(val: number) { this._checkOutPage.set(val); }
  checkOutPageSize = 5;

  // Paginated Check-Ins
  paginatedCheckIns = computed(() => {
    return this.filteredCheckIns();
  });

  // Paginated Check-Outs
  paginatedCheckOuts = computed(() => {
    return this.filteredCheckOuts();
  });

  // Paginated Guests
  paginatedGuests = computed(() => {
    return this.enrichedGuests();
  });

  prevPage() {
    if (this.guestPage > 1) {
      this.guestPage--;
      this.loadCurrentGuests();
    }
  }

  nextPage() {
    if (this.guestPage < this.totalPages()) {
      this.guestPage++;
      this.loadCurrentGuests();
    }
  }

  prevCheckInPage() {
    if (this.checkInPage > 1) {
      this.checkInPage--;
      this.loadTodayCheckIns();
    }
  }

  nextCheckInPage() {
    if (this.checkInPage < this.totalCheckInPages()) {
      this.checkInPage++;
      this.loadTodayCheckIns();
    }
  }

  prevCheckOutPage() {
    if (this.checkOutPage > 1) {
      this.checkOutPage--;
      this.loadTodayCheckOuts();
    }
  }

  nextCheckOutPage() {
    if (this.checkOutPage < this.totalCheckOutPages()) {
      this.checkOutPage++;
      this.loadTodayCheckOuts();
    }
  }

  setTab(tab: 'checkin' | 'checkout' | 'guest') {
    this.activeTab.set(tab);
    this.checkInPage = 1;
    this.checkOutPage = 1;
    this.guestPage = 1;
  }

  // Action: View Details Modal
  viewDetails(booking: any) {
    this.selectedBooking = {
      ...booking,
      roomNumber: this.bookingRoomsMap().get(booking.bookingId) || 'Retrieving...'
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

  // Custom Confirmation Modal Fields
  showConfirmModal = signal<boolean>(false);
  confirmTitle = signal<string>('');
  confirmMessage = signal<string>('');
  confirmAction = signal<'checkin' | 'checkout' | 'cancel' | ''>('');
  confirmTargetId = signal<number | null>(null);
  processingAction = signal<boolean>(false);

  closeConfirmModal() {
    this.showConfirmModal.set(false);
    this.confirmTargetId.set(null);
    this.confirmAction.set('');
    this.processingAction.set(false);
  }

  executeConfirmedAction() {
    const action = this.confirmAction();
    const id = this.confirmTargetId();

    if (!id) return;

    this.processingAction.set(true);

    if (action === 'checkin') {
      this.bookingService.checkIn(id).subscribe({
        next: (response: any) => {
          this.processingAction.set(false);
          this.closeConfirmModal();
          if (response.statusCode === 200 || !response.statusCode) {
            this.toastr.success('Guest checked in successfully.', 'Success');
            this.loadTodayCheckIns();
            this.loadCurrentGuests();
          } else {
            this.toastr.error(response.message || 'Unable to check in guest.', 'Failed');
          }
        },
        error: (err) => {
          this.processingAction.set(false);
          this.closeConfirmModal();
          this.toastr.error(err.error?.message || 'Failed to complete check-in.', 'Error');
        }
      });
    } else if (action === 'checkout') {
      const feedbackUrl = `${window.location.origin}/customer/feedback`;
      this.bookingService.checkOut(id, feedbackUrl).subscribe({
        next: (response: any) => {
          this.processingAction.set(false);
          this.closeConfirmModal();
          if (response.statusCode === 200 || !response.statusCode) {
            this.toastr.success('Guest checked out successfully.', 'Success');
            this.loadTodayCheckOuts();
            this.loadCurrentGuests();
          } else {
            this.toastr.error(response.message || 'Unable to check out guest.', 'Failed');
          }
        },
        error: (err) => {
          this.processingAction.set(false);
          this.closeConfirmModal();
          this.toastr.error(err.error?.message || 'Failed to complete check-out.', 'Error');
        }
      });
    } else if (action === 'cancel') {
      this.bookingService.cancelBooking(id).subscribe({
        next: (response: any) => {
          this.processingAction.set(false);
          this.closeConfirmModal();
          if (response.statusCode === 200 || !response.statusCode) {
            this.toastr.success('Booking has been cancelled.', 'Success');
            this.loadTodayCheckIns();
            this.loadCurrentGuests();
          } else {
            this.toastr.error(response.message || 'Failed to cancel booking.', 'Cancel Failed');
          }
        },
        error: (err) => {
          this.processingAction.set(false);
          this.closeConfirmModal();
          this.toastr.error(err.error?.message || 'Failed to cancel booking.', 'API Error');
        }
      });
    }
  }

  // Action: Check In
  checkIn(bookingId: number) {
    this.confirmTitle.set('Confirm Check-In');
    this.confirmMessage.set('Do you want to complete the check-in process for this guest?');
    this.confirmAction.set('checkin');
    this.confirmTargetId.set(bookingId);
    this.showConfirmModal.set(true);
  }

  // Action: Check Out
  checkOut(bookingId: number) {
    this.confirmTitle.set('Confirm Check-Out');
    this.confirmMessage.set('Do you want to complete the check-out process for this guest?');
    this.confirmAction.set('checkout');
    this.confirmTargetId.set(bookingId);
    this.showConfirmModal.set(true);
  }

  // Action: Cancel Booking
  cancelBooking(bookingId: number) {
    this.confirmTitle.set('Cancel Booking');
    this.confirmMessage.set('Are you sure you want to cancel this room booking? This action is permanent.');
    this.confirmAction.set('cancel');
    this.confirmTargetId.set(bookingId);
    this.showConfirmModal.set(true);
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(this.newCheckOutDate);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      this.toastr.warning('New check-out date must be a date in the future.', 'Validation');
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