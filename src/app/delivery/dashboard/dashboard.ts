import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { FoodMenuService } from '../../../services/foodmenu.service';

@Component({
  selector: 'app-delivery-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DeliveryDashboardComponent implements OnInit {
  readyOrders = signal<any[]>([]);
  loading = signal<boolean>(true);
  processingOrderId = signal<number | null>(null);

  // Confirm modal
  showConfirmModal = false;
  confirmTargetOrder: any = null;

  constructor(
    private foodMenuService: FoodMenuService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadReadyOrders();
  }

  loadReadyOrders(): void {
    this.loading.set(true);
    this.foodMenuService.getReadyOrders().subscribe({
      next: (res: any) => {
        const orders = Array.isArray(res) ? res : (res?.data || res?.items || []);
        this.readyOrders.set(orders);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.loading.set(false);
        if (err.status === 404) {
          this.readyOrders.set([]);
          return;
        }
        this.toastr.error(err.error?.message || 'Failed to fetch ready orders.', 'API Error');
      }
    });
  }

  openConfirmModal(order: any): void {
    this.confirmTargetOrder = order;
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.confirmTargetOrder = null;
  }

  confirmDeliver(): void {
    if (!this.confirmTargetOrder) return;
    const order = this.confirmTargetOrder;
    this.closeConfirmModal();
    this.executeDeliver(order.orderId);
  }

  private executeDeliver(orderId: number): void {
    this.processingOrderId.set(orderId);
    this.foodMenuService.updateOrderStatus(orderId, 'deliver').subscribe({
      next: (res: any) => {
        this.processingOrderId.set(null);
        this.toastr.success(res?.message || `Order #${orderId} delivered successfully!`, '✅ Delivered!');
        this.loadReadyOrders();
      },
      error: (err: any) => {
        this.processingOrderId.set(null);
        this.toastr.error(err.error?.message || 'Could not mark order as delivered.', 'API Error');
      }
    });
  }

  getTotalItems(order: any): number {
    return (order.items || []).reduce((sum: number, i: any) => sum + (i.quantity || 1), 0);
  }
}
