import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RoomRequest } from '../models/RoomRequest.model';
import { apiUrl } from '../environment';

@Injectable({
  providedIn: 'root',
})
export class RoomService {
  private apiUrl = `${apiUrl}Room`;

  constructor(private http: HttpClient) { }

  public RoomApiCall(roomRequest: RoomRequest) {
    const params = new HttpParams()
      .set('Page', roomRequest.Page)
      .set('PageSize', roomRequest.PageSize)
      .set('checkIn', roomRequest.checkIn)
      .set('checkOut', roomRequest.checkOut);

    return this.http.get(`${this.apiUrl}/available`, { params });
  }

  public GetAllRooms(page: number, pageSize: number) {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const params = new HttpParams().set('Page', page).set('PageSize', pageSize);
    return this.http.get(`${this.apiUrl}`, { params, headers });
  }

  public roomSummaryCards() {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get(`${this.apiUrl}/summary-cards`, { headers });
  }

  public AddRoom(formData: FormData) {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.post(`${this.apiUrl}`, formData, { headers });
  }

  public DeleteRoom(roomId: number) {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.delete(`${this.apiUrl}/${roomId}`, { headers });
  }
}
