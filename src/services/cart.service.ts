import { Injectable, signal } from '@angular/core';
import { Room } from '../models/room.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  public cartRooms = signal<Room[]>([]);
  public checkIn = signal<string>('');
  public checkOut = signal<string>('');
  public numberOfGuests = signal<number>(1);

  public addToCart(room: Room) {
    this.cartRooms.update((currentRooms) => {
      if (currentRooms.some((r) => r.roomId === room.roomId)) {
        return currentRooms;
      }
      return [...currentRooms, room];
    });
  }

  public removeFromCart(roomId: number) {
    this.cartRooms.update((currentRooms) => currentRooms.filter((r) => r.roomId !== roomId));
  }

  public clearCart() {
    this.cartRooms.set([]);
    this.checkIn.set('');
    this.checkOut.set('');
    this.numberOfGuests.set(1);
  }

  public setDates(checkIn: string, checkOut: string) {
    this.checkIn.set(checkIn);
    this.checkOut.set(checkOut);
  }

  public setNumberOfGuests(count: number) {
    this.numberOfGuests.set(count);
  }
}
