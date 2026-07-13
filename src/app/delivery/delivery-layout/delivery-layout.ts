import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/login.service';

@Component({
  selector: 'app-delivery-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './delivery-layout.html',
  styleUrl: './delivery-layout.css',
})
export class DeliveryLayoutComponent {
  userName = sessionStorage.getItem('name') || 'Delivery Staff';
  isMobileMenuOpen = signal<boolean>(false);

  constructor(
    private router: Router,
    private authService: AuthService,
  ) { }

  public toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  public closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  public logout() {
    this.authService.logoutApiCall();
  }
}
