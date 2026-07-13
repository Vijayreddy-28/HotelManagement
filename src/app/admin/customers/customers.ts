import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../../../services/user.service';
import { RoomBookingService } from '../../../services/roombooking.service';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './customers.html',
  styleUrl: './customers.css'
})
export class AdminCustomersComponent implements OnInit {
  customers: any[] = [];
  filteredCustomers: any[] = [];
  searchText: string = '';
  loading = true;

  get activeCustomers(): number {
    return this.customers.filter(c => c.isActive).length;
  }

  // Booking history detail modal
  showHistoryModal = false;
  selectedCustomer: any = null;
  bookingHistory: any[] = [];
  loadingHistory = false;

  // Pagination
  currentPage = 1;
  pageSize = 10;

  constructor(
    private userService: UserService,
    private bookingService: RoomBookingService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.userService.getCustomers().subscribe({
      next: (response: any) => {
        this.customers = response || [];
        this.filterCustomers();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(err.error?.message || 'Failed to load customer list.', 'API Error');
      }
    });
  }

  filterCustomers(): void {
    const term = this.searchText.trim().toLowerCase();
    if (!term) {
      this.filteredCustomers = [...this.customers];
    } else {
      this.filteredCustomers = this.customers.filter(c =>
        (c.name || '').toLowerCase().includes(term) ||
        (c.email || '').toLowerCase().includes(term) ||
        (c.phoneNumber || '').includes(term) ||
        (c.adhaarNumber || '').includes(term)
      );
    }
    this.currentPage = 1;
  }

  get paginatedCustomers(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCustomers.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredCustomers.length / this.pageSize));
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  viewBookingHistory(customer: any): void {
    this.selectedCustomer = customer;
    this.bookingHistory = [];
    this.showHistoryModal = true;
    this.loadingHistory = true;

    this.bookingService.getBookingsByCustomerId(customer.userId).subscribe({
      next: (res: any) => {
        this.bookingHistory = res || [];
        this.loadingHistory = false;
      },
      error: (err) => {
        this.loadingHistory = false;
        this.toastr.error(err.error?.message || 'Could not retrieve booking history.', 'API Error');
      }
    });
  }

  closeHistoryModal(): void {
    this.showHistoryModal = false;
    this.selectedCustomer = null;
    this.bookingHistory = [];
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
}
