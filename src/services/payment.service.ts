import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../environment';
import { CreatePaymentRequest, PaymentResponse } from '../models/payment.model';

@Injectable({
    providedIn: 'root',
})
export class PaymentService {
    private base_url = `${apiUrl}Payment`;

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        const token = sessionStorage.getItem('token');
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }

    public createPayment(request: CreatePaymentRequest): Observable<PaymentResponse> {
        return this.http.post<PaymentResponse>(this.base_url, request, {
            headers: this.getHeaders(),
        });
    }

    public getPaymentsByBillId(billId: number): Observable<PaymentResponse[]> {
        return this.http.get<PaymentResponse[]>(`${this.base_url}/bill/${billId}`, {
            headers: this.getHeaders(),
        });
    }
}