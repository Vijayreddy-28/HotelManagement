import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';


import { HousekeepingService } from '../../../services/Housekeeping.service';
import { MyHousekeepingTask } from '../../../models/housekeeping.model';


@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-tasks.html',
  styleUrl: './my-tasks.css',
})
export class MyTasksComponent implements OnInit {
  tasks = signal<MyHousekeepingTask[]>([]);
  loading = signal<boolean>(true);

  // taskId of the row currently mid-flight for Start/Complete, so we only disable that one button
  processingTaskId = signal<number | null>(null);

  getTasksByStatus(status: string): MyHousekeepingTask[] {
    return this.tasks().filter((t) => t.status.toLowerCase() === status.toLowerCase());
  }

  constructor(
    private housekeepingService: HousekeepingService,
    private toastr: ToastrService,
  ) { }

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading.set(true);
    this.housekeepingService.getMyTasks().subscribe({
      next: (res: any) => {
        const taskArray = Array.isArray(res) ? res : (res?.tasks ?? []);
        this.tasks.set(taskArray);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        // A 404 here just means the employee currently has no tasks - not a real error.
        if (err.status === 404) {
          this.tasks.set([]);
          return;
        }
        this.toastr.error(err.error?.message || 'Unable to load your tasks.', 'API Error');
      },
    });
  }

  priorityLabel(priority: string): string {
    return priority || 'Medium';
  }

  priorityClass(priority: string): string {
    switch (priority) {
      case 'High': return 'bg-danger-subtle text-danger border border-danger-subtle';
      case 'Low': return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
      default: return 'bg-warning-subtle text-warning border border-warning-subtle';
    }
  }

  // Custom Confirmation Modal
  showConfirmModal = false;
  confirmActionType: 'start' | 'complete' | null = null;
  confirmTargetTask: MyHousekeepingTask | null = null;

  openConfirmModal(task: MyHousekeepingTask, action: 'start' | 'complete'): void {
    this.confirmTargetTask = task;
    this.confirmActionType = action;
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.confirmTargetTask = null;
    this.confirmActionType = null;
  }

  confirmAction(): void {
    if (!this.confirmTargetTask || !this.confirmActionType) return;
    
    const task = this.confirmTargetTask;
    const action = this.confirmActionType;
    this.closeConfirmModal();

    if (action === 'start') {
      this.executeStartTask(task);
    } else if (action === 'complete') {
      this.executeCompleteTask(task);
    }
  }

  private executeStartTask(task: MyHousekeepingTask): void {
    this.processingTaskId.set(task.taskId);
    this.housekeepingService.startTask(task.taskId).subscribe({
      next: (response: any) => {
        this.processingTaskId.set(null);
        this.toastr.success(response?.message || `Task ${task.taskId} started.`, 'Task Started');
        this.loadTasks();
      },
      error: (err) => {
        this.processingTaskId.set(null);
        this.toastr.error(err.error?.message || 'Unable to start this task.', 'API Error');
      },
    });
  }

  private executeCompleteTask(task: MyHousekeepingTask): void {
    this.processingTaskId.set(task.taskId);
    this.housekeepingService.completeTask(task.taskId).subscribe({
      next: (response: any) => {
        this.processingTaskId.set(null);
        this.toastr.success(response?.message || `Task ${task.taskId} completed.`, 'Task Completed');
        this.loadTasks();
      },
      error: (err: any) => {
        this.processingTaskId.set(null);
        this.toastr.error(err.error?.message || 'Unable to complete this task.', 'API Error');
      },
    });
  }
}