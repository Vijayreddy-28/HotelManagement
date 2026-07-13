import { Injectable, signal, effect } from '@angular/core';
import { Room } from '../models/room.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  public cartRooms = signal<Room[]>([]);
  public checkIn = signal<string>('');
  public checkOut = signal<string>('');
  public numberOfGuests = signal<number>(1);

  constructor() {
    this.loadFromLocalStorage();
    effect(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cartRooms', JSON.stringify(this.cartRooms()));
        localStorage.setItem('checkIn', this.checkIn());
        localStorage.setItem('checkOut', this.checkOut());
        localStorage.setItem('numberOfGuests', this.numberOfGuests().toString());
      }
    });
  }

  private loadFromLocalStorage() {
    if (typeof window === 'undefined') return;
    try {
      const savedRooms = localStorage.getItem('cartRooms');
      if (savedRooms) {
        this.cartRooms.set(JSON.parse(savedRooms));
      }
      const savedCheckIn = localStorage.getItem('checkIn');
      if (savedCheckIn) {
        this.checkIn.set(savedCheckIn);
      }
      const savedCheckOut = localStorage.getItem('checkOut');
      if (savedCheckOut) {
        this.checkOut.set(savedCheckOut);
      }
      const savedGuests = localStorage.getItem('numberOfGuests');
      if (savedGuests) {
        this.numberOfGuests.set(parseInt(savedGuests, 10) || 1);
      }
    } catch (e) {
      console.error('Error loading cart from localStorage', e);
    }
  }

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
