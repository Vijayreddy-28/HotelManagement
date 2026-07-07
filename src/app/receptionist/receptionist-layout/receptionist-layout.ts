import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../services/login.service';

@Component({
  selector: 'app-receptionist-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './receptionist-layout.html',
  styleUrl: './receptionist-layout.css',
})
export class ReceptionistLayoutComponent {
  userName = sessionStorage.getItem('username') || 'Receptionist';
  isSidebarOpen = false;

  constructor(
    private router: Router,
    private toastr: ToastrService,
    private authService: AuthService,
  ) {}

  public toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  public logout() {
    this.authService.logoutApiCall();
  }
}
