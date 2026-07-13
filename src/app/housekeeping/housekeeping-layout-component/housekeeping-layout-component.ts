import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/login.service';

@Component({
  selector: 'app-housekeeping-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './housekeeping-layout-component.html',
  styleUrl: './housekeeping-layout-component.css',
})
export class HousekeepingLayoutComponent {
  userName = sessionStorage.getItem('name') || 'Housekeeping Staff';

  constructor(
    private router: Router,
    private authService: AuthService,
  ) { }

  public logout() {
    this.authService.logoutApiCall();
  }
}