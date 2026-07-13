import { Component, OnInit, signal, computed } from '@angular/core';
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
import { HousekeepingTask, ActiveTasks } from '../../../models/housekeeping.model';
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
  activeTasks = signal<ActiveTasks[]>([]);
  loadingEmployees = signal<boolean>(true);
  loadingTasks = signal<boolean>(true);
  loadingActiveTasks = signal<boolean>(true);
  assigningTask = false;
  assignForm: FormGroup;

  // Pagination for Generated Service Tasks
  private _taskPage = signal<number>(1);
  get taskPage(): number { return this._taskPage(); }
  set taskPage(val: number) { this._taskPage.set(val); }
  taskPageSize = 5;

  paginatedTasks = computed(() => {
    const list = this.tasks();
    const start = (this._taskPage() - 1) * this.taskPageSize;
    return list.slice(start, start + this.taskPageSize);
  });

  totalTaskPages = computed(() => {
    return Math.ceil(this.tasks().length / this.taskPageSize) || 1;
  });

  prevTaskPage(): void {
    if (this.taskPage > 1) this.taskPage--;
  }

  nextTaskPage(): void {
    if (this.taskPage < this.totalTaskPages()) this.taskPage++;
  }

  // Pagination for Active Task Progress
  private _activeTaskPage = signal<number>(1);
  get activeTaskPage(): number { return this._activeTaskPage(); }
  set activeTaskPage(val: number) { this._activeTaskPage.set(val); }
  activeTaskPageSize = 5;

  paginatedActiveTasks = computed(() => {
    const list = this.activeTasks();
    const start = (this._activeTaskPage() - 1) * this.activeTaskPageSize;
    return list.slice(start, start + this.activeTaskPageSize);
  });

  totalActiveTaskPages = computed(() => {
    return Math.ceil(this.activeTasks().length / this.activeTaskPageSize) || 1;
  });

  prevActiveTaskPage(): void {
    if (this.activeTaskPage > 1) this.activeTaskPage--;
  }

  nextActiveTaskPage(): void {
    if (this.activeTaskPage < this.totalActiveTaskPages()) this.activeTaskPage++;
  }

  // ===== Task Progress board (grouped from the same 'tasks' list, no extra API calls) =====
  createdTasks = computed(() => this.tasks().filter(t => t.status === 'Created'));
  assignedTasks = computed(() => this.tasks().filter(t => t.status === 'Assigned'));
  inProgressTasks = computed(() => this.tasks().filter(t => t.status === 'InProgress'));
  completedTasks = computed(() => this.tasks().filter(t => t.status === 'Completed'));

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
    this.loadActiveTasks();
  }

  loadEmployees(): void {
    this.loadingEmployees.set(true);
    this.userService.getHouseKeepingEmployees().subscribe({
      next: (res: any) => {
        // API may return an array directly or an object containing the array
        const employeeArray = Array.isArray(res) ? res : (res?.employees ?? []);
        this.employees.set(employeeArray);
        this.loadingEmployees.set(false);
      },
      error: (err) => {
        this.loadingEmployees.set(false);
        this.toastr.error(err.error?.message || 'Unable to load employees.', 'API Error');
      }
    });
  }

  loadTasks(): void {
    this.loadingTasks.set(true);
    this.housekeepingService.getTasks().subscribe({
      next: (res: any) => {
        const tasksArray = Array.isArray(res) ? res : (res?.tasks ?? []);
        this.tasks.set(tasksArray);
        this.loadingTasks.set(false);
      },
      error: (err) => {
        this.loadingTasks.set(false);
        this.toastr.error(err.error?.message || 'Unable to load housekeeping tasks.', 'API Error');
      }
    });
  }

  loadActiveTasks(): void {
    this.loadingActiveTasks.set(true);
    this.housekeepingService.activeTasks().subscribe({
      next: (res: any) => {
        console.log(res);
        const tasksArray = Array.isArray(res) ? res : (res?.tasks ?? []);
        this.activeTasks.set(tasksArray);
        this.loadingActiveTasks.set(false);
      },
      error: (err) => {
        this.loadingActiveTasks.set(false);
        this.toastr.error(err.error?.message || 'Unable to load active task progress.', 'API Error');
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

    this.assigningTask = true;
    this.housekeepingService.assignTask(taskId, employeeId).subscribe({
      next: (response: any) => {
        this.assigningTask = false;
        const employee = this.employees().find(
          e => e.employeeId == employeeId
        );
        this.toastr.success(
          `Task ${taskId} assigned to ${employee?.name ?? 'Employee'} successfully.`,
          'Task Assigned'
        );
        this.loadTasks();
        this.loadEmployees();
        this.loadActiveTasks();
        this.closeAssignmentModal();
      },
      error: (err) => {
        this.assigningTask = false;
        this.toastr.error(err.error?.message || 'Failed to assign task.', 'API Error');
      }
    });
  }

}