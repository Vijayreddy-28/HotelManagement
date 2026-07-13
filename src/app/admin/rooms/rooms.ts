import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Room } from '../../../models/room.model';
import { RoomService } from '../../../services/room.service';

@Component({
  selector: 'app-admin-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DecimalPipe],
  templateUrl: './rooms.html',
  styleUrl: './rooms.css'
})
export class AdminRoomsComponent implements OnInit {
  rooms = signal<Room[]>([]);
  activeFilter = signal<string>('All');
  searchText = signal<string>('');
  loading = signal<boolean>(true);

  // Pagination
  currentPage = 1;
  pageSize = 12;

  // Add Room Modal
  showAddModal = false;
  addForm!: FormGroup;
  submittingRoom = false;

  readonly statusTabs = ['All', 'Available', 'Occupied', 'Cleaning', 'Dirty'];

  constructor(
    private roomService: RoomService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadRooms();
  }

  initForm(): void {
    this.addForm = this.fb.group({
      typeName: ['', [Validators.required, Validators.minLength(2)]],
      floor: [null, [Validators.required, Validators.min(0)]],
      pricePerNight: [null, [Validators.required, Validators.min(1)]],
      bedType: ['King', Validators.required],
      noOfBeds: [1, [Validators.required, Validators.min(1)]],
      maxOccupancy: [2, [Validators.required, Validators.min(1)]]
    });
  }

  loadRooms() {
    this.loading.set(true);
    this.roomService.GetAllRooms(1, 100).subscribe({
      next: (res: any) => {
        this.rooms.set(res.data || res || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toastr.error(err.error?.message || 'Failed to load retreat inventory.', 'API Error');
      }
    });
  }

  // Filter and search computation
  filteredRooms = computed(() => {
    const filter = this.activeFilter();
    const query = this.searchText().trim().toLowerCase();
    let list = this.rooms();

    // 1. Status Filter
    if (filter !== 'All') {
      list = list.filter((r) => r.status.toLowerCase() === filter.toLowerCase());
    }

    // 2. Search query filter
    if (query) {
      list = list.filter(
        (r) =>
          r.roomNumber?.toString().includes(query) ||
          r.typeName?.toLowerCase().includes(query) ||
          r.status?.toLowerCase().includes(query)
      );
    }

    return list;
  });

  get paginatedRooms(): Room[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRooms().slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredRooms().length / this.pageSize));
  }

  setFilter(status: string) {
    this.activeFilter.set(status);
    this.currentPage = 1;
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  getStatusCount(status: string): number {
    if (status === 'All') return this.rooms().length;
    return this.rooms().filter((r) => r.status.toLowerCase() === status.toLowerCase()).length;
  }

  getStatusBadgeClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'available': return 'badge-available';
      case 'occupied': return 'badge-occupied';
      case 'cleaning': return 'badge-cleaning';
      case 'dirty': return 'badge-dirty';
      default: return 'badge-default';
    }
  }

  getCardBorderClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'available': return 'border-start-available';
      case 'occupied': return 'border-start-occupied';
      case 'cleaning': return 'border-start-cleaning';
      case 'dirty': return 'border-start-dirty';
      default: return '';
    }
  }

  // Modal Actions
  openAddModal(): void {
    this.addForm.reset({
      bedType: 'King',
      noOfBeds: 1,
      maxOccupancy: 2
    });
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  submitRoom(): void {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      this.toastr.warning('Please check all input details.', 'Validation');
      return;
    }

    this.submittingRoom = true;
    const val = this.addForm.value;

    // Automatically generate a transparent 1x1 PNG file behind the scenes
    // to bypass the backend's strict image upload requirement.
    const transparentPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const byteCharacters = atob(transparentPngBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    const dummyFile = new File([blob], 'room_default.png', { type: 'image/png' });

    const fd = new FormData();
    fd.append('TypeName', val.typeName);
    fd.append('Floor', String(val.floor));
    fd.append('PricePerNight', String(val.pricePerNight));
    fd.append('BedType', val.bedType);
    fd.append('NoOfBeds', String(val.noOfBeds));
    fd.append('MaxOccupancy', String(val.maxOccupancy));
    fd.append('Image', dummyFile); // satisfies the required IFormFile on backend

    this.roomService.AddRoom(fd).subscribe({
      next: (res: any) => {
        this.submittingRoom = false;
        this.toastr.success(res?.message || 'Room created successfully.', 'Room Added');
        this.closeAddModal();
        this.loadRooms();
      },
      error: (err) => {
        this.submittingRoom = false;
        this.toastr.error(err.error?.message || 'Failed to add new room.', 'API Error');
      }
    });
  }

  deactivateRoom(room: Room): void {
    if (confirm(`Are you sure you want to deactivate Room ${room.roomNumber}?`)) {
      this.roomService.DeleteRoom(room.roomId).subscribe({
        next: (res: any) => {
          this.toastr.success(res?.message || 'Room deactivated successfully.', 'Deactivated');
          this.loadRooms();
        },
        error: (err) => {
          this.toastr.error(err.error?.message || 'Could not deactivate room.', 'API Error');
        }
      });
    }
  }
}
