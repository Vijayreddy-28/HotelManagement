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
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './available-rooms.html',
  styleUrl: './available-rooms.css',
})
export class AvailableRooms implements OnInit {
  rooms = signal<Room[]>([]);
  searchForm: FormGroup;
  todayDate: string = new Date().toISOString().split('T')[0];
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

    this.roomService.RoomApiCall(request).subscribe({
      next: (response: any) => {
        this.rooms.set(response.data);
        console.log(this.rooms());
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  addToCart(room: any) {
    this.cartService.addToCart(room);
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
