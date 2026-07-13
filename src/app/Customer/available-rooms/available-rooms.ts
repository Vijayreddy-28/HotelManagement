import { Component, OnInit, signal } from '@angular/core';
import { Room } from '../../../models/room.model';
import { RoomService } from '../../../services/room.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoomRequest } from '../../../models/RoomRequest.model';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../services/cart.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-available-rooms',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './available-rooms.html',
  styleUrl: './available-rooms.css',
})
export class AvailableRooms implements OnInit {
  rooms = signal<Room[]>([]);
  searchForm: FormGroup;
  todayDate: string = new Date().toISOString().split('T')[0];
  searching = signal<boolean>(false);

  constructor(
    private roomService: RoomService,
    private fb: FormBuilder,
    public cartService: CartService,
  ) {
    this.searchForm = this.fb.group({
      checkIn: ['', Validators.required],
      checkOut: ['', Validators.required],
    });
  }


  ngOnInit() {
    const savedCheckIn = this.cartService.checkIn();
    const savedCheckOut = this.cartService.checkOut();
    if (savedCheckIn && savedCheckOut) {
      this.searchForm.patchValue({
        checkIn: savedCheckIn,
        checkOut: savedCheckOut
      });
      this.setMinCheckoutDate();
      this.searchRooms();
    }
    this.searchRooms();
  }

  public searchRooms() {
    const request: RoomRequest = {
      checkIn: this.searchForm.value.checkIn,
      checkOut: this.searchForm.value.checkOut,
      Page: 1,
      PageSize: 10,
    };

    this.cartService.setDates(
      this.searchForm.value.checkIn,
      this.searchForm.value.checkOut
    );

    this.searching.set(true);
    this.roomService.RoomApiCall(request).subscribe({
      next: (response: any) => {
        this.rooms.set(response.data || []);
        console.log(this.rooms());
        this.searching.set(false);
      },
      error: (error) => {
        console.log(error);
        this.searching.set(false);
      },
    });
  }

  addToCart(room: any) {
    this.cartService.addToCart(room);
  }

  removeFromCart(room: any) {
    this.cartService.removeFromCart(room.roomId);
  }

  isRoomInCart(roomId: number): boolean {
    return this.cartService.cartRooms().some(r => r.roomId === roomId);
  }

  getRoomTypeIcon(typeName: string): string {
    if (!typeName) return 'bi bi-door-open-fill';
    switch (typeName.toLowerCase()) {
      case 'standard':
        return 'bi bi-house-door-fill';
      case 'deluxe':
        return 'bi bi-stars';
      case 'executive':
        return 'bi bi-gem';
      case 'familyroom':
        return 'bi bi-people-fill';
      default:
        return 'bi bi-door-open-fill';
    }
  }

  minCheckoutDate = '';

  setMinCheckoutDate() {
    const checkIn = this.searchForm.value.checkIn;

    if (checkIn) {
      const date = new Date(checkIn);
      date.setDate(date.getDate() + 1);
      this.minCheckoutDate = date.toISOString().split('T')[0];
    }
  }
}
