import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, signal, effect } from '@angular/core';
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

  constructor(private http: HttpClient) {
    this.loadFromLocalStorage();
    effect(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('foodCartItems', JSON.stringify(this.cartItems()));
        
        const bookingId = this.selectedBookingId();
        if (bookingId !== null) {
          localStorage.setItem('selectedBookingId', bookingId.toString());
        } else {
          localStorage.removeItem('selectedBookingId');
        }
        
        const roomId = this.selectedRoomId();
        if (roomId !== null) {
          localStorage.setItem('selectedRoomId', roomId.toString());
        } else {
          localStorage.removeItem('selectedRoomId');
        }
        
        const roomNumber = this.selectedRoomNumber();
        if (roomNumber !== null) {
          localStorage.setItem('selectedRoomNumber', roomNumber.toString());
        } else {
          localStorage.removeItem('selectedRoomNumber');
        }
      }
    });
  }

  private loadFromLocalStorage() {
    if (typeof window === 'undefined') return;
    try {
      const savedItems = localStorage.getItem('foodCartItems');
      if (savedItems) {
        this.cartItems.set(JSON.parse(savedItems));
      }
      const savedBookingId = localStorage.getItem('selectedBookingId');
      if (savedBookingId) {
        this.selectedBookingId.set(parseInt(savedBookingId, 10));
      }
      const savedRoomId = localStorage.getItem('selectedRoomId');
      if (savedRoomId) {
        this.selectedRoomId.set(parseInt(savedRoomId, 10));
      }
      const savedRoomNumber = localStorage.getItem('selectedRoomNumber');
      if (savedRoomNumber) {
        this.selectedRoomNumber.set(parseInt(savedRoomNumber, 10));
      }
    } catch (e) {
      console.error('Error loading food cart from localStorage', e);
    }
  }

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

  private getHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  public getAllFoodMenuItems(page: number = 1, pageSize: number = 100) {
    const url = `${apiUrl}FoodMenu/available-items?Page=${page}&PageSize=${pageSize}`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  public addFoodMenuItem(formData: FormData) {
    return this.http.post(`${apiUrl}FoodMenu`, formData, { headers: this.getHeaders() });
  }

  public updateFoodMenuItem(itemId: number, payload: any) {
    return this.http.put(`${apiUrl}FoodMenu/${itemId}`, payload, { headers: this.getHeaders() });
  }

  public getKitchenOrders(page: number = 1, pageSize: number = 50) {
    const url = `${apiUrl}FoodOrder/kitchen?Page=${page}&PageSize=${pageSize}`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  public updateOrderStatus(orderId: number, action: 'start-preparing' | 'ready' | 'deliver' | 'cancel') {
    const url = `${apiUrl}FoodOrder/${orderId}/${action}`;
    return this.http.post(url, {}, { headers: this.getHeaders() });
  }

  public getReadyOrders() {
    const url = `${apiUrl}FoodOrder/ready-orders`;
    return this.http.get<any[]>(url, { headers: this.getHeaders() });
  }
}
