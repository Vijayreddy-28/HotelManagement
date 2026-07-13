import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { FoodMenuService } from '../../../services/foodmenu.service';
import { FoodCategory } from '../../../models/foodmenu.model';

@Component({
  selector: 'app-admin-food',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DecimalPipe],
  templateUrl: './food.html',
  styleUrl: './food.css'
})
export class AdminFoodComponent implements OnInit {
  // Menu items
  menuItems: any[] = [];
  filteredMenuItems: any[] = [];
  menuSearch = '';
  loadingMenu = true;

  // Food Orders
  orders: any[] = [];
  filteredOrders: any[] = [];
  orderSearch = '';
  loadingOrders = true;

  // Summary stats derived from menu + orders
  get totalMenuItems() { return this.menuItems.length; }
  get availableItems() { return this.menuItems.filter(i => i.isAvailable !== false).length; }
  get pendingOrders() { return this.orders.filter(o => (o.status || '').toLowerCase() === 'pending').length; }
  get deliveringOrders() { return this.orders.filter(o => ['ready', 'preparing'].includes((o.status || '').toLowerCase())).length; }

  // Add Modal
  showAddModal = false;
  addForm!: FormGroup;
  selectedFile: File | null = null;
  submittingMenu = false;
  editMode = false;
  editItemId: number | null = null;

  FoodCategory = FoodCategory;
  readonly categories = [
    { value: FoodCategory.Breakfast, label: 'Breakfast' },
    { value: FoodCategory.MainCourse, label: 'Main Course' },
    { value: FoodCategory.Snacks, label: 'Snacks' },
    { value: FoodCategory.Dessert, label: 'Dessert' },
    { value: FoodCategory.Beverage, label: 'Beverage' },
    { value: FoodCategory.Starter, label: 'Starter' },
  ];

  constructor(
    private foodMenuService: FoodMenuService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadMenuItems();
    this.loadOrders();
  }

  initForm(): void {
    this.addForm = this.fb.group({
      itemName: ['', [Validators.required, Validators.minLength(3)]],
      category: [FoodCategory.MainCourse, Validators.required],
      price: [null, [Validators.required, Validators.min(1)]],
      isAvailable: [true]
    });
  }

  // ==================== MENU ====================
  loadMenuItems(): void {
    this.loadingMenu = true;
    this.foodMenuService.getAllFoodMenuItems(1, 100).subscribe({
      next: (res: any) => {
        this.menuItems = Array.isArray(res) ? res : (res?.data || res?.items || []);
        this.filterMenu();
        this.loadingMenu = false;
      },
      error: (err) => {
        this.loadingMenu = false;
        if (err.status === 404 || err.error?.message?.toLowerCase().includes('not found') || err.error?.message?.toLowerCase().includes('unavailable')) {
          this.menuItems = [];
          this.filterMenu();
        } else {
          this.toastr.error(err.error?.message || 'Failed to load food menu.', 'API Error');
        }
      }
    });
  }

  filterMenu(): void {
    const term = this.menuSearch.trim().toLowerCase();
    this.filteredMenuItems = term
      ? this.menuItems.filter(i =>
          (i.itemName || '').toLowerCase().includes(term) ||
          (i.category || '').toLowerCase().includes(term))
      : [...this.menuItems];
  }

  getCategoryLabel(cat: string | number): string {
    const found = this.categories.find(c => c.value === Number(cat) || c.label.toLowerCase() === String(cat).toLowerCase());
    return found ? found.label : String(cat);
  }

  getFoodImageUrl(item: any): string {
    const categoryName = this.getCategoryLabel(item.category).toLowerCase();
    if (!item.imageUrl) {
      switch (categoryName) {
        case 'breakfast': return 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=300&q=80';
        case 'main course':
        case 'maincourse': return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&q=80';
        case 'snacks': return 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=300&q=80';
        case 'beverage': return 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&w=300&q=80';
        case 'dessert': return 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=300&q=80';
        default: return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';
      }
    }
    if (item.imageUrl.startsWith('uploads') || item.imageUrl.startsWith('images') || item.imageUrl.startsWith('/uploads') || item.imageUrl.startsWith('/images')) {
      const path = item.imageUrl.startsWith('/') ? item.imageUrl.substring(1) : item.imageUrl;
      return `http://localhost:5149/${path}`;
    }
    return item.imageUrl;
  }

  // ==================== ADD MENU ====================
  openAddModal(): void {
    this.editMode = false;
    this.editItemId = null;
    this.selectedFile = null;
    this.addForm.reset({ category: FoodCategory.MainCourse, isAvailable: true });
    this.showAddModal = true;
  }

  openEditModal(item: any): void {
    this.editMode = true;
    this.editItemId = item.itemId;
    this.selectedFile = null;
    this.addForm.patchValue({
      itemName: item.itemName,
      category: this.categories.find(c => c.label.toLowerCase() === (item.category || '').toLowerCase())?.value || FoodCategory.MainCourse,
      price: item.price,
      isAvailable: item.isAvailable !== false
    });
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onFileChange(event: any): void {
    this.selectedFile = event.target.files[0] || null;
  }

  submitMenu(): void {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      this.toastr.warning('Please fill in all required fields.', 'Validation');
      return;
    }
    this.submittingMenu = true;
    const val = this.addForm.value;

    if (this.editMode && this.editItemId !== null) {
      // Update (JSON PUT)
      const payload = {
        itemName: val.itemName,
        category: Number(val.category),
        price: Number(val.price),
        isAvailable: Boolean(val.isAvailable)
      };
      this.foodMenuService.updateFoodMenuItem(this.editItemId, payload).subscribe({
        next: () => {
          this.submittingMenu = false;
          this.toastr.success('Menu item updated successfully.', 'Updated');
          this.closeAddModal();
          this.loadMenuItems();
        },
        error: (err) => {
          this.submittingMenu = false;
          this.toastr.error(err.error?.message || 'Failed to update menu item.', 'API Error');
        }
      });
    } else {
      // Add (FormData POST)
      const fd = new FormData();
      fd.append('ItemName', val.itemName);
      fd.append('Category', String(Number(val.category)));
      fd.append('Price', String(Number(val.price)));
      fd.append('IsAvailable', String(Boolean(val.isAvailable)));
      if (this.selectedFile) fd.append('Image', this.selectedFile);

      this.foodMenuService.addFoodMenuItem(fd).subscribe({
        next: (res: any) => {
          this.submittingMenu = false;
          this.toastr.success(res?.message || 'New menu item added successfully.', 'Added');
          this.closeAddModal();
          this.loadMenuItems();
        },
        error: (err) => {
          this.submittingMenu = false;
          this.toastr.error(err.error?.message || 'Failed to add menu item.', 'API Error');
        }
      });
    }
  }

  toggleItemAvailability(item: any): void {
    const payload = {
      itemName: item.itemName,
      category: this.categories.findIndex(c => c.label.toLowerCase() === (item.category || '').toLowerCase()) + 1 || 2,
      price: item.price,
      isAvailable: !item.isAvailable
    };
    this.foodMenuService.updateFoodMenuItem(item.itemId, payload).subscribe({
      next: () => {
        item.isAvailable = !item.isAvailable;
        this.toastr.success(`${item.itemName} is now ${item.isAvailable ? 'available' : 'unavailable'}.`, 'Updated');
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Could not update item status.', 'API Error');
      }
    });
  }

  // ==================== ORDERS ====================
  loadOrders(): void {
    this.loadingOrders = true;
    this.foodMenuService.getKitchenOrders(1, 50).subscribe({
      next: (res: any) => {
        this.orders = Array.isArray(res) ? res : (res?.data || res?.items || []);
        this.filterOrders();
        this.loadingOrders = false;
      },
      error: (err) => {
        this.loadingOrders = false;
        if (err.status === 404 || err.error?.message?.toLowerCase().includes('not found')) {
          this.orders = [];
          this.filterOrders();
        } else {
          this.toastr.error(err.error?.message || 'Failed to load food orders.', 'API Error');
        }
      }
    });
  }

  filterOrders(): void {
    const term = this.orderSearch.trim().toLowerCase();
    this.filteredOrders = term
      ? this.orders.filter(o =>
          o.orderId?.toString().includes(term) ||
          (o.status || '').toLowerCase().includes(term) ||
          o.roomNumber?.toString().includes(term) ||
          o.items?.some((it: any) => (it.foodName || '').toLowerCase().includes(term))
        )
      : [...this.orders];
  }

  getOrderStatusClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'pending':    return 'bg-warning-subtle text-warning border border-warning-subtle';
      case 'preparing':  return 'bg-primary-subtle text-primary border border-primary-subtle';
      case 'ready':      return 'bg-info-subtle text-info border border-info-subtle';
      case 'delivered':  return 'bg-success-subtle text-success border border-success-subtle';
      case 'cancelled':  return 'bg-danger-subtle text-danger border border-danger-subtle';
      default:           return 'bg-light text-dark';
    }
  }

  advanceOrderStatus(order: any): void {
    const status = (order.status || '').toLowerCase();
    let action: 'start-preparing' | 'ready' | 'deliver' | 'cancel';
    if (status === 'pending') action = 'start-preparing';
    else if (status === 'preparing') action = 'ready';
    else if (status === 'ready') action = 'deliver';
    else return;

    this.foodMenuService.updateOrderStatus(order.orderId, action).subscribe({
      next: (res: any) => {
        this.toastr.success(res?.message || 'Order status updated.', 'Updated');
        this.loadOrders();
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Failed to update order.', 'API Error');
      }
    });
  }

  canAdvance(order: any): boolean {
    const s = (order.status || '').toLowerCase();
    return ['pending', 'preparing', 'ready'].includes(s);
  }

  getNextActionLabel(order: any): string {
    const s = (order.status || '').toLowerCase();
    if (s === 'pending') return 'Start Preparing';
    if (s === 'preparing') return 'Mark Ready';
    if (s === 'ready') return 'Mark Delivered';
    return '';
  }
}
