import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../services/login.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayoutComponent {
  userName = sessionStorage.getItem('name') || 'Administrator';
  isMobileMenuOpen = signal<boolean>(false);

  constructor(
    private router: Router,
    private toastr: ToastrService,
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
