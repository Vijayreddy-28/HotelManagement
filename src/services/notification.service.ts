import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { apiUrl } from '../environment';
import { ToastrService } from 'ngx-toastr';

@Injectable({
    providedIn: 'root'
})
export class NotificationHubService {
    private hubConnection!: signalR.HubConnection;
    private isConnected = false;

    // Reactive notification store
    notifications = signal<any[]>([]);
    unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);

    // Real-time room status updates (discrete events, e.g. housekeeping start/complete)
    roomStatusChanged$ = new Subject<{ roomId: number; status: string }>();

    constructor(private http: HttpClient, private toastr: ToastrService) {}

    private getHeaders(): HttpHeaders {
        const token = sessionStorage.getItem('token');
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }

    private getNotifications() {
        return this.http.get<any[]>(`${apiUrl}Notification`, { headers: this.getHeaders() });
    }

    private markAsRead(id: number) {
        return this.http.put(`${apiUrl}Notification/${id}/read`, {}, { headers: this.getHeaders() });
    }

    loadNotifications() {
        console.log("🔔 loadNotifications called");
        const token = sessionStorage.getItem('token');
        if (!token) {
            console.log("⚠️ No token found in sessionStorage");
            return;
        }

        this.getNotifications().subscribe({
            next: (data) => {
                console.log("📋 Notifications loaded from API:", data);
                const sorted = (data || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                this.notifications.set(sorted);
            },
            error: (err) => console.error("❌ Failed to load notifications", err)
        });
    }

    markNotificationAsRead(id: number) {
        this.markAsRead(id).subscribe({
            next: () => {
                this.notifications.update(list =>
                    list.map(n => n.notificationId === id ? { ...n, isRead: true } : n)
                );
            },
            error: (err) => console.error("Failed to mark notification as read", err)
        });
    }

    markAllAsRead() {
        const unreadList = this.notifications().filter(n => !n.isRead);
        if (unreadList.length === 0) return;

        import('rxjs').then(({ forkJoin }) => {
            const requests = unreadList.map(n => this.markAsRead(n.notificationId));
            forkJoin(requests).subscribe({
                next: () => {
                    this.notifications.update(list =>
                        list.map(n => ({ ...n, isRead: true }))
                    );
                },
                error: (err) => console.error("Failed to mark all as read", err)
            });
        });
    }

    startConnection() {
        if (this.isConnected || (this.hubConnection && this.hubConnection.state !== signalR.HubConnectionState.Disconnected)) {
            return;
        }

        const token = sessionStorage.getItem('token');

        if (!token) {
            console.error("JWT Token not found.");
            return;
        }

        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5149/hotelHub", {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .build();

        this.hubConnection.start()
            .then(() => {
                console.log("✅ SignalR Connected");
                this.isConnected = true;
            })
            .catch(err => {
                console.error("❌ SignalR Connection Failed");
                console.error(err);
                this.isConnected = false;
            });

        this.hubConnection.onreconnecting(error => {
            console.log("Reconnecting...", error);
        });

        this.hubConnection.onreconnected(connectionId => {
            console.log("Reconnected:", connectionId);
            this.isConnected = true;
        });

        this.hubConnection.onclose(error => {
            console.log("Connection Closed", error);
            this.isConnected = false;
        });
    }

    stopConnection() {
        if (this.hubConnection) {
            this.hubConnection.stop()
                .then(() => {
                    console.log("SignalR Connection Stopped");
                    this.isConnected = false;
                })
                .catch(err => console.error("Error stopping SignalR", err));
        }
    }

    listenForNotifications() {
        if (!this.hubConnection) return;

        this.hubConnection.off("RoomStatusChanged");
        this.hubConnection.on("RoomStatusChanged", (payload: { roomId: number; status: string }) => {
            console.log("Room status changed", payload);
            this.roomStatusChanged$.next(payload);
        });

        this.hubConnection.off("ReceiveNotification");
        this.hubConnection.on("ReceiveNotification", (notification) => {
            console.log("Notification Received", notification);
            // Append incoming notification at the beginning of the list
            this.notifications.update(list => {
                // Prevent duplicate insertions
                if (list.some(n => n.notificationId === notification.notificationId)) {
                    return list;
                }
                
                // Show toast for real-time notification
                this.toastr.info(notification.message, 'Notification', {
                    timeOut: 5000,
                    progressBar: true
                });

                return [notification, ...list];
            });
        });
    }
}