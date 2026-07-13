import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-admin-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DecimalPipe],
  templateUrl: './employees.html',
  styleUrl: './employees.css'
})
export class AdminEmployeesComponent implements OnInit {
  employees: any[] = [];
  filteredEmployees: any[] = [];
  searchText: string = '';
  loading = true;
  submitting = false;

  get activeCount(): number {
    return this.employees.filter(e => e.isActive).length;
  }

  showRegModal = false;
  regForm!: FormGroup;

  // Role translation mapping
  rolesMap: { [key: number]: string } = {
    1: 'Admin',
    2: 'Customer',
    3: 'Receptionist',
    4: 'Delivery Person',
    5: 'Housekeeping',
    6: 'Chef'
  };

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadEmployees();
  }

  initForm(): void {
    this.regForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      role: [3, [Validators.required]], // Default to Receptionist
      gender: [1, [Validators.required]], // Default to Male
      dateOfBirth: ['', [Validators.required]],
      salary: [10000, [Validators.required, Validators.min(1)]],
      city: ['', [Validators.required]],
      country: ['', [Validators.required]]
    });
  }

  loadEmployees(): void {
    this.loading = true;
    this.userService.getAllEmployees().subscribe({
      next: (response: any) => {
        console.log(this.employees);
        this.employees = response || [];
        this.filterEmployees();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(err.error?.message || 'Failed to load employees list.', 'API Error');
      }
    });
  }

  filterEmployees(): void {
    const term = this.searchText.trim().toLowerCase();
    if (!term) {
      this.filteredEmployees = [...this.employees];
    } else {
      this.filteredEmployees = this.employees.filter(e =>
        (e.userName || '').toLowerCase().includes(term) ||
        (e.email || '').toLowerCase().includes(term) ||
        (this.rolesMap[e.role] || '').toLowerCase().includes(term)
      );
    }
  }

  openRegModal(): void {
    this.regForm.reset({
      role: 3,
      gender: 1,
      salary: 10000
    });
    this.showRegModal = true;
  }

  closeRegModal(): void {
    this.showRegModal = false;
  }

  getRoleName(roleNum: number): string {
    return this.rolesMap[roleNum] || 'Staff';
  }

  getRoleBadgeClass(roleNum: number): string {
    switch (roleNum) {
      case 1: return 'bg-danger-subtle text-danger border border-danger-subtle';
      case 3: return 'bg-primary-subtle text-primary border border-primary-subtle';
      case 4: return 'bg-info-subtle text-info border border-info-subtle';
      case 5: return 'bg-warning-subtle text-warning border border-warning-subtle';
      case 6: return 'bg-success-subtle text-success border border-success-subtle';
      default: return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
    }
  }

  toggleEmployeeStatus(employee: any): void {
    console.log(employee);
    const action = employee.isActive ? 'Deactivate' : 'Activate';
    this.userService.toggleEmployeeStatus(employee.userId).subscribe({
      next: (res: any) => {
        employee.isActive = !employee.isActive;
        this.toastr.success(`Employee ${employee.userName} successfully ${employee.isActive ? 'activated' : 'deactivated'}.`, 'Success');
      },
      error: (err) => {
        this.toastr.error(err.error?.message || `Failed to ${action.toLowerCase()} employee.`, 'API Error');
      }
    });
  }

  onSubmit(): void {
    if (this.regForm.invalid) {
      this.regForm.markAllAsTouched();
      this.toastr.warning('Please correct all validation errors before submitting.', 'Form Validation');
      return;
    }

    this.submitting = true;
    const formVal = this.regForm.value;

    // Format payload matching backend
    const payload = {
      userName: formVal.userName,
      email: formVal.email,
      password: formVal.password,
      phone: formVal.phone,
      role: Number(formVal.role),
      gender: Number(formVal.gender),
      dateOfBirth: formVal.dateOfBirth, // YYYY-MM-DD string is parsed as DateOnly
      salary: Number(formVal.salary),
      city: formVal.city,
      country: formVal.country
    };

    this.userService.registerEmployee(payload).subscribe({
      next: (response: any) => {
        this.submitting = false;
        this.toastr.success(response.message || 'New employee registered successfully.', 'Registration Successful');
        this.closeRegModal();
        this.loadEmployees();
      },
      error: (err) => {
        this.submitting = false;
        this.toastr.error(err.error?.message || 'Employee registration failed.', 'API Error');
      }
    });
  }
}