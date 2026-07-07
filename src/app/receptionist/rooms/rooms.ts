import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Room } from '../../../models/room.model';
import { RoomService } from '../../../services/room.service';

@Component({
  selector: 'app-receptionist-rooms',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rooms.html',
  styleUrl: './rooms.css',
})
export class ReceptionistRoomsComponent implements OnInit {
  rooms = signal<Room[]>([]);
  activeFilter = signal<string>('All');

  // Computed signal that filters dynamically when rooms or activeFilter changes
  filteredRooms = computed(() => {
    const filter = this.activeFilter();
    const list = this.rooms();
    if (filter === 'All') {
      return list;
    }
    return list.filter((r) => r.status.toLowerCase() === filter.toLowerCase());
  });

  constructor(private roomService: RoomService) { }

  ngOnInit(): void {
    this.loadRooms();
  }

  loadRooms() {
    this.roomService.GetAllRooms(1, 100).subscribe({
      next: (res: any) => {
        this.rooms.set(res.data || []);
      },
      error: (err) => {
        console.error('Failed to load rooms:', err);
      }
    });
  }

  filterRooms(status: string) {
    this.activeFilter.set(status);
  }
}
