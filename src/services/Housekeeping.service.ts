import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { apiUrl } from "../environment";


@Injectable({
    providedIn: 'root'
})
export class HousekeepingService {
    url = `${apiUrl}HouseKeeping`;
    constructor(private http: HttpClient) { }
    public getTasks() {
        const token = sessionStorage.getItem('token');
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
        return this.http.get(`${this.url}/generated-tasks`, { headers });
    }

    public assignTask(taskId: number, empId: number) {
        const token = sessionStorage.getItem('token');
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
        return this.http.post(`${this.url}/assign?taskId=${taskId}&employeeId=${empId}`, {}, { headers });
    }
}