import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

import { RoomService } from '../../../services/room.service';
import { RoomBookingService } from '../../../services/roombooking.service';
import { ActivityLogService } from '../../../services/activitylog.service';
import { ActivityLogResponse, ActivityType } from '../../../models/activitylog.model';

@Component({
  selector: 'app-receptionist-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class ReceptionistDashboardComponent implements OnInit {
  today = new Date();

  loadingStats = true;
  loadingActivities = true;

  // Activity Feed pagination
  activityPage = 1;
  activityPageSize = 10;
  activityTotalPages = 1;
  activityTotalRecords = 0;

  // Room Summary API (Room/summary-cards)
  roomStats = {
    totalRooms: 0,
    availableRooms: 0,
    cleaningRooms: 0,
    maintainingRooms: 0,
    occupiedRooms: 0,
    dirtyRooms: 0,
    outOfServiceRooms: 0
  };

  // Booking Summary API (RoomBooking/summary-cards)
  bookingStats = {
    totalBookings: 0,
    activeBookings: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
    cancelledBookings: 0,
    todayRevenue: 0,
    occupiedRooms: 0,
    availableRooms: 0
  };

  recentActivities: ActivityLogResponse[] = [];

  constructor(
    private roomService: RoomService,
    private roomBookingService: RoomBookingService,
    private activityLogService: ActivityLogService,
    private toastr: ToastrService,
    private router: Router
  ) { }


  ngOnInit(): void {
    this.loadRoomSummary();
    this.loadBookingSummary();
    this.loadActivities();
  }

  private loadRoomSummary(): void {
    this.roomService.roomSummaryCards().subscribe({
      next: (response: any) => {
        this.roomStats = {
          totalRooms: response.totalRooms ?? 0,
          availableRooms: response.availableRooms ?? 0,
          cleaningRooms: response.cleaningRooms ?? 0,
          maintainingRooms: response.maintainingRooms ?? 0,
          occupiedRooms: response.occupiedRooms ?? 0,
          dirtyRooms: response.dirtyRooms ?? 0,
          outOfServiceRooms: response.outOfServiceRooms ?? 0
        };
        this.loadingStats = false;
      },
      error: (err) => {
        this.loadingStats = false;
        this.toastr.error(err.error?.message || 'Unable to load room summary.', 'API Error');
      }
    });
  }

  private loadBookingSummary(): void {
    this.roomBookingService.getBookingSummaryCards().subscribe({
      next: (response: any) => {
        this.bookingStats = {
          totalBookings: response.totalBookings ?? 0,
          activeBookings: response.activeBookings ?? 0,
          todayCheckIns: response.todayCheckIns ?? 0,
          todayCheckOuts: response.todayCheckOuts ?? 0,
          cancelledBookings: response.cancelledBookings ?? 0,
          todayRevenue: response.todayRevenue ?? 0,
          occupiedRooms: response.occupiedRooms ?? 0,
          availableRooms: response.availableRooms ?? 0
        };
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Unable to load booking summary.', 'API Error');
      }
    });
  }

  loadActivities(): void {
    this.loadingActivities = true;
    this.activityLogService.getActivities(
      this.activityPage,
      this.activityPageSize
    ).subscribe({
      next: (res: any) => {
        this.recentActivities = res.data || [];
        this.activityTotalPages = res.totalPages || 1;
        this.activityTotalRecords = res.totalRecords || 0;
        this.loadingActivities = false;
      },
      error: (err: any) => {
        this.loadingActivities = false;
        this.toastr.error(err.error?.message || 'Unable to load activity feed.', 'API Error');
      }
    });
  }


  prevActivityPage(): void {
    if (this.activityPage > 1) {
      this.activityPage--;
      this.loadActivities();
    }
  }

  nextActivityPage(): void {
    if (this.activityPage < this.activityTotalPages) {
      this.activityPage++;
      this.loadActivities();
    }
  }

  getActivityIcon(type: ActivityType): string {
    switch (type) {
      case ActivityType.Booking: return 'bi-journal-plus';
      case ActivityType.CheckIn: return 'bi-box-arrow-in-right';
      case ActivityType.CheckOut: return 'bi-box-arrow-right';
      case ActivityType.Payment: return 'bi-cash-coin';
      case ActivityType.FoodOrder: return 'bi-egg-fried';
      case ActivityType.Housekeeping: return 'bi-stars';
      case ActivityType.Room: return 'bi-door-open-fill';
      case ActivityType.User: return 'bi-person-fill';
      default: return 'bi-info-circle';
    }
  }

  getActivityTypeClass(type: ActivityType): string {
    switch (type) {
      case ActivityType.Booking: return 'bg-primary text-white';
      case ActivityType.CheckIn: return 'bg-success text-white';
      case ActivityType.CheckOut: return 'bg-danger text-white';
      case ActivityType.Payment: return 'bg-warning text-dark';
      case ActivityType.FoodOrder: return 'bg-info text-white';
      case ActivityType.Housekeeping: return 'bg-secondary text-white';
      case ActivityType.Room: return 'bg-dark text-white';
      case ActivityType.User: return 'bg-primary-subtle text-primary';
      default: return 'bg-light text-dark';
    }
  }

  quickNavigate(routePath: string): void {
    this.router.navigate([routePath]);
  }
}