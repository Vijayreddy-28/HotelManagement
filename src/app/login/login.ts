import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/login.service';
import { LoginModel } from '../../models/login.model';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  registerForm: FormGroup;
  constructor(
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService,
    private toastr: ToastrService
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

    this.authService.LoginApiCall(login).subscribe({
      next: (response: any) => {
        if (response.statusCode == 400) {
          this.toastr.error(response.message, 'Login Failed');
          return;

        }
        console.log(response);
        sessionStorage.setItem('token', response.token);
        sessionStorage.setItem('username', response.username);
        sessionStorage.setItem('role', response.role);
        console.log(response);
        this.toastr.success('Welcome ' + response.name, 'Login Successful');
        setTimeout(() => {
          if (response.role === 'Receptionist') {
            this.router.navigate(['/receptionist']);
          } else {
            this.router.navigate(['/customer']);
          }
        }, 1500);
      },
      error: (error) => {
        this.toastr.error('Something went wrong', 'Login Failed');
      },
    });
  }
}
