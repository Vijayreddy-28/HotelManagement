import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FoodMenuService } from '../../../services/foodmenu.service';
import { FoodOrderService } from '../../../services/foodorder.service';
import { RoomBookingService } from '../../../services/roombooking.service';
import { FoodMenu } from '../../../models/foodmenu.model';
import { FoodOrder } from '../../../models/foodorder.model';
import { CurrentRooms } from '../../../models/room.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-food-order',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './food-order.html',
  styleUrl: './food-order.css',
})
export class FoodOrderComponent implements OnInit {
  bookingId = 0;
  roomId = 0;
  roomNumber = 0;
  specialInstructions = '';
  showConfirmModal = false;
  pendingOrderPayload: any = null;

  // Room delivery options
  allRooms: any[] = [];
  selectedBookingOption = ''; // format: "bookingId-roomId-roomNumber"

  constructor(
    private foodMenuService: FoodMenuService,
    private foodOrderService: FoodOrderService,
    private roomBookingService: RoomBookingService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    // 1. Read existing selection if any
    this.bookingId = this.foodMenuService.selectedBookingId() || 0;
    this.roomId = this.foodMenuService.selectedRoomId() || 0;
    this.roomNumber = this.foodMenuService.selectedRoomNumber() || 0;

    if (this.bookingId && this.roomId) {
      this.selectedBookingOption = `${this.bookingId}-${this.roomId}-${this.roomNumber}`;
    }

    // 2. Fetch all active bookings for this customer
    this.loadActiveBookings();
  }

  onRoomNumberChange(roomNumVal: any) {
    if (!roomNumVal) return;
    const num = parseInt(roomNumVal, 10);
    this.roomNumber = num;

    const matchedRoom = this.allRooms.find(r => r.roomNumber === num);
    if (matchedRoom) {
      this.selectRoom(matchedRoom.bookingId, matchedRoom.roomId, num);
    }
  }

  loadActiveBookings() {
    this.roomBookingService.getMyBookings().subscribe({
      next: (res: any) => {
        this.allRooms = Array.isArray(res) ? res : [];

        // Auto-select first booked room if no previous selection exists
        if (!this.bookingId && this.allRooms.length > 0) {
          const opt = this.allRooms[0];
          this.selectRoom(opt.bookingId, opt.roomId, opt.roomNumber);
        }
      },
      error: (err) => {
        console.error('Failed to load active room bookings.', err);
        this.allRooms = [];
      }
    });
  }

  selectRoom(bookingId: number, roomId: number, roomNumber: number) {
    this.bookingId = bookingId;
    this.roomId = roomId;
    this.roomNumber = roomNumber;
    this.selectedBookingOption = `${bookingId}-${roomId}-${roomNumber}`;
    // Update in service for consistency
    this.foodMenuService.selectedBookingId.set(bookingId);
    this.foodMenuService.selectedRoomId.set(roomId);
    this.foodMenuService.selectedRoomNumber.set(roomNumber);
  }

  // Grouped cart items signal for template compatibility
  cartItems = computed(() => {
    const items = this.foodMenuService.cartItems();
    const groups = new Map<number, any>();
    for (const item of items) {
      if (groups.has(item.itemId)) {
        groups.get(item.itemId).quantity++;
      } else {
        groups.set(item.itemId, {
          itemId: item.itemId,
          foodItemId: item.itemId,
          itemName: item.itemName,
          name: item.itemName,
          category: item.category,
          price: item.price,
          imageUrl: item.imageUrl,
          isVeg: item.isVeg || false,
          quantity: 1
        });
      }
    }
    return Array.from(groups.values());
  });

  // Cart operations
  increaseQty(item: any) {
    const found = this.foodMenuService.cartItems().find(x => x.itemId === item.itemId);
    if (found) {
      this.foodMenuService.addToCart(found);
    }
  }

  decreaseQty(item: any) {
    this.foodMenuService.removeCart(item.itemId);
  }

  removeItem(item: any) {
    this.foodMenuService.removeItemCompletely(item.itemId);
  }

  // Pricing calculations based on raw cart items
  subtotal = computed(() => {
    return this.foodMenuService.cartItems().reduce((sum, item) => sum + item.price, 0);
  });

  tax = computed(() => {
    return parseFloat((this.subtotal() * 0.05).toFixed(2));
  });

  grandTotal = computed(() => {
    return parseFloat((this.subtotal() + this.tax()).toFixed(2));
  });

  // Convert to DTO consist of bookingid, roomid, and list of fooditems, then confirm order
  confirmOrder() {
    const rawCartItems = this.foodMenuService.cartItems();
    if (rawCartItems.length === 0) {
      this.toastr.warning('Please add items to your cart before confirming the order.', 'Empty Cart');
      return;
    }

    if (!this.bookingId || !this.roomId) {
      this.toastr.error('Room and booking information are missing. Please re-select your room.', 'Missing Details');
      this.router.navigate(['/customer/food']);
      return;
    }

    // Convert grouped cart items to match C# backend DTO structure (CreateOrderRequest / CreateOrderItemRequest)
    const itemsPayload = this.cartItems().map(item => ({
      foodMenuId: item.itemId,
      quantity: item.quantity
    }));

    this.pendingOrderPayload = {
      bookingId: this.bookingId,
      roomId: this.roomId,
      items: itemsPayload
    };

    this.showConfirmModal = true;
  }

  cancelOrder() {
    this.showConfirmModal = false;
    this.pendingOrderPayload = null;
  }

  executeOrder() {
    if (!this.pendingOrderPayload) return;
    this.showConfirmModal = false;

    this.toastr.info('Sending your order details to the kitchen...', 'Processing Order');

    this.foodOrderService.foodOrderApiCall(this.pendingOrderPayload).subscribe({
      next: (response: any) => {
        this.toastr.success(response.message || 'Your order has been successfully sent to the kitchen.', 'Order Placed!');
        this.foodMenuService.clearCart();
        this.router.navigate(['/customer/food']);
      },
      error: (err: any) => {
        this.toastr.error(err.error?.message || err.message || 'An error occurred while placing your food order. Please try again.', 'Order Failed');
      },
    });
  }
}
