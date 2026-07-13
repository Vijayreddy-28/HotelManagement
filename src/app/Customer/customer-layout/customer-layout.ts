import { Component, computed, signal, effect, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { CartService } from '../../../services/cart.service';
import { FoodMenuService } from '../../../services/foodmenu.service';
import { NotificationHubService } from '../../../services/notification.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './customer-layout.html',
  styleUrl: './customer-layout.css',
})
export class CustomerLayoutComponent implements OnInit, OnDestroy {
  userName = sessionStorage.getItem('name') || 'Customer';
  roomCartCount = computed(() => this.cartService.cartRooms().length);
  foodCartCount = computed(() => this.foodMenuService.cartItems().length);

  isMobileMenuOpen = signal<boolean>(false);

  // Notifications properties
  showNotificationsPanel = signal<boolean>(false);
  unreadNotificationsCount = computed(() => this.notificationService.unreadCount());
  notificationsList = computed(() => this.notificationService.notifications().filter(n => !n.isRead));

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  constructor(
    private router: Router,
    private cartService: CartService,
    private foodMenuService: FoodMenuService,
    private notificationService: NotificationHubService,
    private toastr: ToastrService
  ) {
    // Watch notifications list to automatically drop down/pop up the panel on initial load if unread notifications exist
    let initialLoadDone = false;
    effect(() => {
      const list = this.notificationService.notifications();
      if (list.length > 0 && !initialLoadDone) {
        const unreadCount = list.filter(n => !n.isRead).length;
        if (unreadCount > 0) {
          this.showNotificationsPanel.set(true);
        }
        initialLoadDone = true;
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.notificationService.loadNotifications();
    window.addEventListener('click', this.closePanelOnOutsideClick);
  }

  ngOnDestroy() {
    window.removeEventListener('click', this.closePanelOnOutsideClick);
  }

  closePanelOnOutsideClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.notifications-dropdown-wrapper')) {
      this.showNotificationsPanel.set(false);
    }
  }

  toggleNotifications(event: MouseEvent) {
    event.stopPropagation();
    this.showNotificationsPanel.update(v => !v);
  }

  markAllAsRead(event: MouseEvent) {
    event.stopPropagation();
    this.notificationService.markAllAsRead();
  }

  onNotificationClick(notification: any, event: MouseEvent) {
    event.stopPropagation();
    if (!notification.isRead) {
      this.notificationService.markNotificationAsRead(notification.notificationId);
    }
  }

  getNotificationIconClass(type: number): string {
    switch (type) {
      case 0: return 'icon-system';
      case 1: return 'icon-booking';
      case 2: return 'icon-food';
      case 3: return 'icon-housekeeping';
      default: return 'icon-general';
    }
  }

  getNotificationIcon(type: number): string {
    switch (type) {
      case 0: return 'bi-info-circle-fill';
      case 1: return 'bi-calendar-check-fill';
      case 2: return 'bi-egg-fried';
      case 3: return 'bi-brush-fill';
      default: return 'bi-bell-fill';
    }
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  showLogoutConfirm = signal<boolean>(false);

  public logout() {
    this.showLogoutConfirm.set(true);
  }

  public cancelLogout() {
    this.showLogoutConfirm.set(false);
  }

  public confirmLogout() {
    this.showLogoutConfirm.set(false);
    this.cartService.clearCart();
    sessionStorage.clear();
    this.toastr.success('You have been successfully signed out.', 'Signed Out');
    this.router.navigate(['/']);
  }
}
