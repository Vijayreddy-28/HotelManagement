import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { apiUrl } from '../environment';
import { FoodMenu } from '../models/foodmenu.model';

@Injectable({
  providedIn: 'root',
})
export class FoodMenuService {
  public cartItems = signal<FoodMenu[]>([]);
  public selectedBookingId = signal<number | null>(null);
  public selectedRoomId = signal<number | null>(null);
  public selectedRoomNumber = signal<number | null>(null);

  constructor(private http: HttpClient) { }

  public getFoodMenu(page: number, pageSize: number) {
    const url = `${apiUrl}FoodMenu/available-items?Page=${page}&PageSize=${pageSize}`;
    return this.http.get(url);
  }

  public addToCart(foodItem: FoodMenu) {
    this.cartItems.update((currentItems) => [...currentItems, foodItem]);
  }

  public removeCart(itemId: number) {
    this.cartItems.update((currentItems) => {
      const idx = currentItems.findIndex((item) => item.itemId === itemId);
      if (idx !== -1) {
        const copy = [...currentItems];
        copy.splice(idx, 1);
        return copy;
      }
      return currentItems;
    });
  }

  public foodItemsbyCategory(category: string) {
    const url = `${apiUrl}FoodMenu/category/${category}`;
    return this.http.get(url);
  }

  public removeItemCompletely(itemId: number) {
    this.cartItems.update((currentItems) => currentItems.filter((item) => item.itemId !== itemId));
  }

  public clearCart() {
    this.cartItems.set([]);
    this.selectedBookingId.set(null);
    this.selectedRoomId.set(null);
    this.selectedRoomNumber.set(null);
  }

  public deleteFoodMenu(foodMenuId: number) {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const url = `${apiUrl}FoodMenu/${foodMenuId}`;
    return this.http.delete(url, { headers });
  }
}

