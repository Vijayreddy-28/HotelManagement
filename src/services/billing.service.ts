import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { apiUrl } from "../environment";



@Injectable()
export class BillingService {

    constructor(private http: HttpClient) { }

    public payBill(bookingId: number) {
        const url = `${apiUrl}payment/${bookingId}`;
        const token = sessionStorage.getItem('token');
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
        return this.http.post(url, { headers });
    }

    public generateBill(bookingId: number) {
        const url = `${apiUrl}Bill/generate/${bookingId}`;
        const token = sessionStorage.getItem('token');
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
        return this.http.post(url, {}, { headers });
    }
}