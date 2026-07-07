import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Register } from '../../models/register';
import { GuestRegisterService } from '../../services/guestRegister.service';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class GuestRegisterComponent {
  registerForm: FormGroup;
  successMessage = '';
  constructor(
    private router: Router,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private gusetService: GuestRegisterService,
  ) {
    this.registerForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(5)]],
      email: ['', [Validators.required, Validators.minLength(10)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      aadhaarNumber: ['', [Validators.required, Validators.pattern('^[0-9]{12}$')]],
    });
  }

  public onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    const guest: Register = {
      userName: this.registerForm.value.userName!,
      email: this.registerForm.value.email!,
      phone: this.registerForm.value.phone!,
      password: this.registerForm.value.password!,
      aadhaarNumber: this.registerForm.value.aadhaarNumber!,
    };
    this.gusetService.RegisterApiCall(guest).subscribe({
      next: (response: any) => {
        if (response.statusCode == 400) {
          this.toastr.error(response.message, 'Registration Failed');
          return;
        }
        this.toastr.success(response.message, 'Registration Success');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.log(err);
      },
    });
  }
  public Login() {
    this.router.navigate(['/login']);
  }
}
