import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { CartService } from '../../../services/cart.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './customer-layout.html',
  styleUrl: './customer-layout.css',
})
export class CustomerLayoutComponent {
  userName = sessionStorage.getItem('username') || 'Customer';
  constructor(
    private router: Router,
    private cartService: CartService,
    private toastr: ToastrService
  ) { }

  public logout() {
    Swal.fire({
      title: 'Sign Out',
      text: 'Are you sure you want to sign out?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Sign Out',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
    }).then((result) => {
      if (result.isConfirmed) {
        this.cartService.clearCart();
        sessionStorage.clear();

        this.toastr.success('You have been successfully signed out.', 'Signed Out');
        this.router.navigate(['/']);
      }
    });
  }
}
