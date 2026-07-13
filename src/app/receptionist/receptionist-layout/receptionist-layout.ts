import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../services/login.service';

@Component({
  selector: 'app-receptionist-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './receptionist-layout.html',
  styleUrl: './receptionist-layout.css',
})
export class ReceptionistLayoutComponent {
  userName = sessionStorage.getItem('name') || 'Receptionist';
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
