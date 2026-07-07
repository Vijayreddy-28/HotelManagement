import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FoodOrder } from '../models/foodorder.model';
import { apiUrl } from '../environment';

@Injectable({
  providedIn: 'root',
})
export class FoodOrderService {
  constructor(public http: HttpClient) {}
  public foodOrderApiCall(request: any) {
    const url = `${apiUrl}FoodOrder`;
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.post(url, request, { headers });
  }
}

