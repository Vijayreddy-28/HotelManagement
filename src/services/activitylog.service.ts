import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../environment';
import { ActivityLogResponse } from '../models/activitylog.model';

@Injectable({
  providedIn: 'root'
})
export class ActivityLogService {
  private base_url = `${apiUrl}ActivityLog`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  public getRecentActivities(): Observable<ActivityLogResponse[]> {
    return this.http.get<ActivityLogResponse[]>(`${this.base_url}/recent`, {
      headers: this.getHeaders()
    });
  }
}
