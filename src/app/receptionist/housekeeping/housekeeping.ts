import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../../../services/user.service';

import { Employee } from '../../../models/user.model';
import { HousekeepingTask } from '../../../models/housekeeping.model';
import { HousekeepingService } from '../../../services/Housekeeping.service';

@Component({
  selector: 'app-receptionist-housekeeping',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './housekeeping.html',
  styleUrl: './housekeeping.css'
})
export class ReceptionistHousekeepingComponent implements OnInit {

  isModalOpen = false;
  employees = signal<Employee[]>([]);
  tasks = signal<HousekeepingTask[]>([]);
  assignForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private userService: UserService,
    private housekeepingService: HousekeepingService
  ) {
    this.assignForm = this.fb.group({
      taskId: ['', Validators.required],
      employeeId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadTasks();
  }

  loadEmployees(): void {
    this.userService.getHouseKeepingEmployees().subscribe({
      next: (res: any) => {
        console.log(res)
        // API may return an array directly or an object containing the array
        const employeeArray = Array.isArray(res) ? res : (res?.employees ?? []);
        this.employees.set(employeeArray);
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Unable to load employees');
      }
    });
  }

  loadTasks(): void {
    this.housekeepingService.getTasks().subscribe({
      next: (res: any) => {
        const tasksArray = Array.isArray(res) ? res : (res?.tasks ?? []);
        setTimeout(() => {
          this.tasks.set(tasksArray);
        });
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Unable to load');
      }
    });
  }
  openAssignmentModal(taskId?: number, employeeId?: number): void {

    this.assignForm.patchValue({
      taskId: taskId ?? '',
      employeeId: employeeId ?? ''
    });

    this.isModalOpen = true;
  }

  closeAssignmentModal(): void {
    this.isModalOpen = false;
    this.assignForm.reset();
  }
  assignTask(): void {

    if (this.assignForm.invalid) {
      this.assignForm.markAllAsTouched();
      return;
    }

    const { taskId, employeeId } = this.assignForm.value;

    this.housekeepingService.assignTask(taskId, employeeId).subscribe({
      next: (response: any) => {
        console.log(response);
        const employee = this.employees().find(
          e => e.employeeId == employeeId
        );
        this.toastr.success(
          `Task ${taskId} assigned to ${employee?.name ?? 'Employee'} successfully.`,
          'Task Assigned'
        );
        this.loadTasks();
        this.loadEmployees();
        this.closeAssignmentModal();
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Failed to assign task');
      }
    });
  }

}