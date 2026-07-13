import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { RoomBookingService } from '../../../services/roombooking.service';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './bookings.html',
  styleUrl: './bookings.css'
})
export class AdminBookingsComponent implements OnInit {
  allBookings = signal<any[]>([]);
  searchText = '';
  activeStatus = 'All';
  loading = true;

  // Pagination
  currentPage = 1;
  pageSize = 12;

  // Room lookup map
  bookingRoomsMap = new Map<number, string>();

  readonly statusTabs = ['All', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled'];

  constructor(
    private bookingService: RoomBookingService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadAllBookings();
  }

  loadAllBookings(): void {
    this.loading = true;
    const statuses = ['Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled'];
    const results: any[] = [];
    let done = 0;

    statuses.forEach(status => {
      this.bookingService.getBookingsByStatus(status).subscribe({
        next: (res: any) => {
          const list = Array.isArray(res) ? res : [];
          list.forEach((b: any) => {
            if (!results.find(r => r.bookingId === b.bookingId)) {
              results.push({ ...b, status });
            }
          });
          done++;
          if (done === statuses.length) {
            results.sort((a, b) => b.bookingId - a.bookingId);
            this.allBookings.set(results);
            this.loading = false;
            this.prefetchRooms(results);
          }
        },
        error: () => {
          done++;
          if (done === statuses.length) {
            results.sort((a, b) => b.bookingId - a.bookingId);
            this.allBookings.set(results);
            this.loading = false;
          }
        }
      });
    });
  }

  prefetchRooms(bookings: any[]): void {
    bookings.forEach(b => {
      if (!this.bookingRoomsMap.has(b.bookingId)) {
        this.bookingService.getBookingRooms(b.bookingId).subscribe({
          next: (res: any) => {
            const rooms = Array.isArray(res) ? res : [];
            const nums = rooms.map((r: any) => r.roomNumber).join(', ');
            this.bookingRoomsMap.set(b.bookingId, nums || 'N/A');
          },
          error: () => {
            this.bookingRoomsMap.set(b.bookingId, 'N/A');
          }
        });
      }
    });
  }

  filteredBookings = computed(() => {
    const term = this.searchText.trim().toLowerCase();
    let list = this.allBookings();
    if (this.activeStatus !== 'All') {
      list = list.filter(b => (b.status || '').toLowerCase() === this.activeStatus.toLowerCase());
    }
    if (term) {
      list = list.filter(b =>
        b.bookingId.toString().includes(term) ||
        (b.customerName || '').toLowerCase().includes(term) ||
        (b.status || '').toLowerCase().includes(term)
      );
    }
    return list;
  });

  get paginatedBookings(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredBookings().slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredBookings().length / this.pageSize));
  }

  setStatus(status: string): void {
    this.activeStatus = status;
    this.currentPage = 1;
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  getStatusClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'confirmed': return 'bg-success-subtle text-success border border-success-subtle';
      case 'checkedin': return 'bg-primary-subtle text-primary border border-primary-subtle';
      case 'checkedout': return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
      case 'cancelled': return 'bg-danger-subtle text-danger border border-danger-subtle';
      default: return 'bg-light text-dark';
    }
  }

  getStatusCount(status: string): number {
    if (status === 'All') return this.allBookings().length;
    return this.allBookings().filter(b => (b.status || '').toLowerCase() === status.toLowerCase()).length;
  }

  getStatusBadgeClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'confirmed':  return 'badge-confirmed';
      case 'checkedin':  return 'badge-checkedin';
      case 'checkedout': return 'badge-checkedout';
      case 'cancelled':  return 'badge-cancelled';
      default:           return 'badge-default';
    }
  }

  getStatIcon(tab: string): string {
    switch (tab) {
      case 'All':        return 'bi-journal-bookmark-fill';
      case 'Confirmed':  return 'bi-check-circle-fill';
      case 'CheckedIn':  return 'bi-box-arrow-in-right';
      case 'CheckedOut': return 'bi-box-arrow-right';
      case 'Cancelled':  return 'bi-x-circle-fill';
      default:           return 'bi-circle';
    }
  }

  getStatIconClass(tab: string): string {
    switch (tab) {
      case 'All':        return 'icon-navy';
      case 'Confirmed':  return 'icon-green';
      case 'CheckedIn':  return 'icon-blue';
      case 'CheckedOut': return 'icon-amber';
      case 'Cancelled':  return 'icon-red';
      default:           return 'icon-navy';
    }
  }
}
