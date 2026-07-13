import { Component, signal } from '@angular/core';
import { WelcomeComponent } from './welcome/welcome';
import { GuestRegisterComponent } from './register/register';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NotificationHubService } from '../services/notification.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('HotelManagement');

  constructor(
    private router: Router,
    private notificationService: NotificationHubService
  ) {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(() => {
      const token = sessionStorage.getItem('token');
      if (token) {
        this.notificationService.startConnection();
        this.notificationService.listenForNotifications();
      } else {
        this.notificationService.stopConnection();
      }
    });
  }
}
