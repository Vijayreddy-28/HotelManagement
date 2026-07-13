import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { FoodMenuService } from '../../../services/foodmenu.service';

@Component({
  selector: 'app-chef-dashboard',
  standalone: true,
  imports: [CommonModule, DecimalPipe, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class ChefDashboardComponent implements OnInit {
  orders = signal<any[]>([]);
  loading = signal<boolean>(true);
  processingOrderId = signal<number | null>(null);

  // Custom Confirm Modals
  showConfirmModal = false;
  confirmActionType: 'start' | 'ready' | 'deliver' | null = null;
  confirmTargetOrder: any = null;

  constructor(
    private foodMenuService: FoodMenuService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    // Fetch Pending/Preparing orders and Ready orders in parallel
    const kitchen$ = this.foodMenuService.getKitchenOrders(1, 100);
    const ready$ = this.foodMenuService.getReadyOrders();

    import('rxjs').then(({ forkJoin }) => {
      forkJoin([kitchen$, ready$]).subscribe({
        next: ([kitchenRes, readyRes]: [any, any]) => {
          const kitchenOrders = Array.isArray(kitchenRes) ? kitchenRes : (kitchenRes?.data || kitchenRes?.items || []);
          const readyOrders = Array.isArray(readyRes) ? readyRes : [];
          this.orders.set([...kitchenOrders, ...readyOrders]);
          this.loading.set(false);
        },
        error: (err: any) => {
          this.loading.set(false);
          if (err.status === 404) {
            this.orders.set([]);
            return;
          }
          this.toastr.error(err.error?.message || 'Failed to fetch kitchen orders.', 'API Error');
        }
      });
    });
  }

  getOrdersByStatus(status: string): any[] {
    return this.orders().filter(o => (o.status || '').toLowerCase() === status.toLowerCase());
  }

  openConfirmModal(order: any, action: 'start' | 'ready' | 'deliver'): void {
    this.confirmTargetOrder = order;
    this.confirmActionType = action;
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.confirmTargetOrder = null;
    this.confirmActionType = null;
  }

  confirmAction(): void {
    if (!this.confirmTargetOrder || !this.confirmActionType) return;
    const order = this.confirmTargetOrder;
    const action = this.confirmActionType;
    this.closeConfirmModal();

    if (action === 'start') {
      this.executeStartPreparing(order.orderId);
    } else if (action === 'ready') {
      this.executeMarkReady(order.orderId);
    } else if (action === 'deliver') {
      this.executeDeliver(order.orderId);
    }
  }

  private executeStartPreparing(orderId: number): void {
    this.processingOrderId.set(orderId);
    this.foodMenuService.updateOrderStatus(orderId, 'start-preparing').subscribe({
      next: (res: any) => {
        this.processingOrderId.set(null);
        this.toastr.success(res?.message || `Preparing order #${orderId}`, 'Status Updated');
        this.loadOrders();
      },
      error: (err: any) => {
        this.processingOrderId.set(null);
        this.toastr.error(err.error?.message || 'Could not start preparing this order.', 'API Error');
      }
    });
  }

  private executeMarkReady(orderId: number): void {
    this.processingOrderId.set(orderId);
    this.foodMenuService.updateOrderStatus(orderId, 'ready').subscribe({
      next: (res: any) => {
        this.processingOrderId.set(null);
        this.toastr.success(res?.message || `Order #${orderId} marked ready`, 'Status Updated');
        this.loadOrders();
      },
      error: (err: any) => {
        this.processingOrderId.set(null);
        this.toastr.error(err.error?.message || 'Could not update order status.', 'API Error');
      }
    });
  }

  private executeDeliver(orderId: number): void {
    this.processingOrderId.set(orderId);
    this.foodMenuService.updateOrderStatus(orderId, 'deliver').subscribe({
      next: (res: any) => {
        this.processingOrderId.set(null);
        this.toastr.success(res?.message || `Order #${orderId} marked as Delivered`, 'Delivered!');
        this.loadOrders();
      },
      error: (err: any) => {
        this.processingOrderId.set(null);
        this.toastr.error(err.error?.message || 'Could not mark order as delivered.', 'API Error');
      }
    });
  }

  getOrderTotalItemsCount(order: any): number {
    return (order.items || []).reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
  }
}
