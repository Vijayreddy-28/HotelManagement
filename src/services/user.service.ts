import { Injectable } from "@angular/core";
import { apiUrl } from "../environment";
import { HttpClient, HttpHeaders } from "@angular/common/http";

@Injectable({
    providedIn: 'root'
})
export class UserService {
    base_url = apiUrl;

    constructor(private http: HttpClient) {}

    private getHeaders(): HttpHeaders {
        const token = sessionStorage.getItem('token');
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }

    public getHouseKeepingEmployees() {
        return this.http.get(this.base_url + 'User/employees/status/Available', { headers: this.getHeaders() });
    }

    public getCustomers() {
        return this.http.get(this.base_url + 'User/customers', { headers: this.getHeaders() });
    }

    public getAllEmployees() {
        return this.http.get(this.base_url + 'User/employees', { headers: this.getHeaders() });
    }
}