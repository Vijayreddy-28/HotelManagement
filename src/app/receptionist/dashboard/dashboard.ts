import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomService } from '../../../services/room.service';

@Component({
  selector: 'app-receptionist-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class ReceptionistDashboardComponent {
  today = new Date();

  // Mock data for receptionist dashboard
  stats = {
    occupiedRooms: 0,
    totalRooms: 0,
    availableRooms: 0,
    checkedInGuests: 0,
    pendingCheckIns: 0,
    pendingCheckOuts: 0,
    dirtyRooms: 0,
    pendingPayments: 0
  };



  recentActivities = [
    { time: '10:30 AM', type: 'checkin', text: 'Mr. & Mrs. Sharma checked into Room 104' },
    { time: '09:45 AM', type: 'checkout', text: 'Dr. John Doe checked out from Room 202, invoice paid' },
    { time: '09:15 AM', type: 'cleaning', text: 'Room 105 status updated to Cleaned' },
    { time: '08:00 AM', type: 'booking', text: 'New direct booking received for Room 301 (Premium Suite)' }
  ];

  constructor(private roomService: RoomService) { }

  ngOnInit(): void {
    this.roomService.roomSummaryCards().subscribe({
      next: (response: any) => {
        this.stats.occupiedRooms = response.occupied;
        this.stats.totalRooms = response.totalRooms;
        this.stats.availableRooms = response.availableRooms;
        this.stats.dirtyRooms = response.dirtyRooms;
      }
    });
  }
}
