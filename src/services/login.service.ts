import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LoginModel } from '../models/login.model';
import { apiUrl } from '../environment';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class AuthService {
  constructor(
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService,
  ) {}
  public LoginApiCall(loginModel: LoginModel) {
    let url = `${apiUrl}Auth/login`;
    return this.http.post(url, loginModel);
  }

  public logoutApiCall() {
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
        sessionStorage.clear();
        this.toastr.success('You have been successfully signed out.', 'Signed Out');
        this.router.navigate(['/']);
      }
    });
  }
}
