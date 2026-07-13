import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { apiUrl } from "../environment";
import { MyHousekeepingTask, TaskStatus, ActiveTasks } from "../models/housekeeping.model";


@Injectable({
    providedIn: 'root'
})
export class HousekeepingService {
    url = `${apiUrl}HouseKeeping`;
    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        const token = sessionStorage.getItem('token');
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }

    public getTasks() {
        return this.http.get(`${this.url}/generated-tasks`, { headers: this.getHeaders() });
    }

    public assignTask(taskId: number, empId: number) {
        return this.http.post(`${this.url}/assign?taskId=${taskId}&employeeId=${empId}`, {}, { headers: this.getHeaders() });
    }

    // ===================== Housekeeping role (employee-facing) =====================

    /** Tasks assigned to the logged-in housekeeping employee. Optionally filter by status. */
    public getMyTasks(status?: TaskStatus) {
        const url = status !== undefined && status !== null
            ? `${this.url}/my-tasks?status=${TaskStatus[status]}`
            : `${this.url}/my-tasks`;
        return this.http.get<MyHousekeepingTask[]>(url, { headers: this.getHeaders() });
    }

    /** Moves a task from Assigned -> InProgress (also marks the room as Cleaning). */
    public startTask(taskId: number) {
        return this.http.post(`${this.url}/start/${taskId}`, {}, { headers: this.getHeaders() });
    }

    /** Moves a task from InProgress -> Completed (room + employee become Available again). */
    public completeTask(taskId: number) {
        return this.http.post(`${this.url}/complete/${taskId}`, {}, { headers: this.getHeaders() });
    }

    public activeTasks() {
        return this.http.get<ActiveTasks[]>(`${this.url}/active-tasks`, { headers: this.getHeaders() });
    }
}