/* Add this method to roombooking.service.ts */
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RoomBooking } from '../models/roombooking.model';
import { apiUrl } from '../environment';

@Injectable({
  providedIn: 'root',
})
export class RoomBookingService {
  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  public roomBookingCall(request: RoomBooking) {
    const url = `${apiUrl}RoomBooking/book`;
    return this.http.post(url, request, { headers: this.getHeaders() });
  }

  public getMyBookings() {
    const url = `${apiUrl}Room/booked-rooms`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  public getMyBookingDetails() {
    const url = `${apiUrl}RoomBooking/my`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  public getBookingRooms(bookingId: number) {
    const url = `${apiUrl}RoomBooking/${bookingId}/rooms`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  public checkIn(bookingId: number) {
    const url = `${apiUrl}RoomBooking/${bookingId}/checkin`;
    return this.http.post(url, {}, { headers: this.getHeaders() });
  }

  public checkOut(bookingId: number) {
    const url = `${apiUrl}RoomBooking/${bookingId}/checkout`;
    return this.http.post(url, {}, { headers: this.getHeaders() });
  }

  public cancelBooking(bookingId: number) {
    const url = `${apiUrl}RoomBooking/${bookingId}/cancel`;
    return this.http.post(url, {}, { headers: this.getHeaders() });
  }

  public getTodayCheckIns(page: number = 1, pageSize: number = 5) {
    const url = `${apiUrl}RoomBooking/today-checkins?page=${page}&pageSize=${pageSize}`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  public getTodayCheckOuts(page: number = 1, pageSize: number = 5) {
    const url = `${apiUrl}RoomBooking/today-checkouts?page=${page}&pageSize=${pageSize}`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  public getCurrentGusests(page: number = 1, pageSize: number = 5) {
    const url = `${apiUrl}RoomBooking/current-guests?page=${page}&pageSize=${pageSize}`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  public getBookingSummaryCards() {
    const url = `${apiUrl}RoomBooking/summary-cards`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  public extendStay(bookingId: number, newCheckOutDate: string) {
    const url = `${apiUrl}RoomBooking/${bookingId}/extend-stay`;
    return this.http.post(url, { newCheckOutDate }, { headers: this.getHeaders() });
  }

  public getBookingsByStatus(status: string) {
    const url = `${apiUrl}RoomBooking/status/${status}`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  public getBookingsByCustomerId(customerId: number) {
    const url = `${apiUrl}RoomBooking/customer/${customerId}`;
    return this.http.get(url, { headers: this.getHeaders() });
  }
}
