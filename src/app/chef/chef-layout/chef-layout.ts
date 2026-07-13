import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/login.service';

@Component({
  selector: 'app-chef-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './chef-layout.html',
  styleUrl: './chef-layout.css',
})
export class ChefLayoutComponent {
  userName = sessionStorage.getItem('name') || 'Chef Staff';
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
