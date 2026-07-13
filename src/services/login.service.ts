import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LoginModel } from '../models/login.model';
import { apiUrl } from '../environment';
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
    sessionStorage.clear();
    this.toastr.success('You have been successfully signed out.', 'Signed Out');
    this.router.navigate(['/']);
  }
}
