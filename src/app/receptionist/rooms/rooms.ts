import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Room } from '../../../models/room.model';
import { RoomService } from '../../../services/room.service';
import { NotificationHubService } from '../../../services/notification.service';

@Component({
  selector: 'app-receptionist-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rooms.html',
  styleUrl: './rooms.css',
})
export class ReceptionistRoomsComponent implements OnInit, OnDestroy {
  private roomStatusSub?: Subscription;

  rooms = signal<Room[]>([]);
  activeFilter = signal<string>('All');
  searchText = signal<string>('');
  statusTabs = ['All', 'Available', 'Occupied', 'Cleaning', 'Dirty'];

  loading = signal<boolean>(true);

  // Pagination
  currentPage = 1;
  pageSize = 12;

  // Computed signal that filters dynamically when rooms, activeFilter, or searchText changes
  filteredRooms = computed(() => {
    let list = this.rooms();
    const filter = this.activeFilter();
    const search = this.searchText().trim().toLowerCase();

    if (filter !== 'All') {
      list = list.filter((r) => r.status.toLowerCase() === filter.toLowerCase());
    }

    if (search) {
      list = list.filter((r) => 
        r.roomNumber.toString().includes(search) || 
        r.typeName.toLowerCase().includes(search) || 
        r.status.toLowerCase().includes(search)
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

  constructor(
    private roomService: RoomService,
    private notify: NotificationHubService
  ) { }

  ngOnInit(): void {
    this.loadRooms();

    // Live-update a room's status when housekeeping (or check-in) changes it
    this.roomStatusSub = this.notify.roomStatusChanged$.subscribe(({ roomId, status }) => {
      this.rooms.update(list =>
        list.map(r => r.roomId === roomId ? { ...r, status } : r)
      );
    });
  }

  ngOnDestroy(): void {
    this.roomStatusSub?.unsubscribe();
  }

  loadRooms() {
    this.loading.set(true);
    this.roomService.GetAllRooms(1, 100).subscribe({
      next: (res: any) => {
        this.rooms.set(res.data || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load rooms:', err);
        this.loading.set(false);
      }
    });
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
    const list = this.rooms();
    if (status === 'All') {
      return list.length;
    }
    return list.filter((r) => r.status.toLowerCase() === status.toLowerCase()).length;
  }
}
