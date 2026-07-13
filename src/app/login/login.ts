import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/login.service';
import { LoginModel } from '../../models/login.model';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { RouterModule } from '@angular/router';
import { NotificationHubService } from '../../services/notification.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  registerForm: FormGroup;
  loggingIn = false;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService,
    private toastr: ToastrService,
    private notificationHubService: NotificationHubService
  ) {
    this.registerForm = this.fb.group({
      loginId: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  public Login() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    const login: LoginModel = {
      loginId: this.registerForm.value.loginId,
      password: this.registerForm.value.password,
    };

    this.loggingIn = true;
    this.authService.LoginApiCall(login).subscribe({
      next: (response: any) => {
        if (response.statusCode == 400) {
          this.toastr.error(response.message, 'Login Failed');
          this.loggingIn = false;
          return;

        }
        console.log(response);
        sessionStorage.setItem('token', response.token);
        sessionStorage.setItem('username', response.username);
        sessionStorage.setItem('role', response.role);
        sessionStorage.setItem('name', response.name);
        this.notificationHubService.startConnection();
        this.notificationHubService.listenForNotifications();
        this.toastr.success('Welcome ' + response.name, 'Login Successful');
        setTimeout(() => {
          if (response.role === 'Receptionist') {
            this.router.navigate(['/receptionist']);
          }
          else if (response.role === 'Customer') {
            this.router.navigate(['/customer']);
          }
          else if (response.role === 'Admin') {
            this.router.navigate(['/admin']);
          }
          else if (response.role === 'Housekeeping') {
            this.router.navigate(['/housekeeping']);
          }
          else if (response.role === 'Chef') {
            this.router.navigate(['/chef']);
          }
          else if (response.role === 'DeliveryPerson') {
            this.router.navigate(['/delivery']);
          }
        }, 1500);
      },
      error: (error) => {
        this.toastr.error('Something went wrong', 'Login Failed');
        this.loggingIn = false;
      },
    });
  }
}
