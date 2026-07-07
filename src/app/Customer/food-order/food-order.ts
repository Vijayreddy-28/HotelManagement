import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FoodMenuService } from '../../../services/foodmenu.service';
import { FoodOrderService } from '../../../services/foodorder.service';
import { FoodMenu } from '../../../models/foodmenu.model';
import { FoodOrder } from '../../../models/foodorder.model';
import Swal from 'sweetalert2';

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

  constructor(
    private foodMenuService: FoodMenuService,
    private foodOrderService: FoodOrderService,
    private router: Router
  ) {}

  ngOnInit() {
    // Read room and booking details from foodMenuService
    this.bookingId = this.foodMenuService.selectedBookingId() || 0;
    this.roomId = this.foodMenuService.selectedRoomId() || 0;
    this.roomNumber = this.foodMenuService.selectedRoomNumber() || 0;

    // Fallback if the user navigated here directly without selecting a room
    if (!this.bookingId || !this.roomId) {
      Swal.fire({
        icon: 'info',
        title: 'Room Selection Required',
        text: 'Please select a room before opening the food cart.',
        confirmButtonColor: '#2563eb',
      }).then(() => {
        this.router.navigate(['/customer/food']);
      });
    }
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
      Swal.fire({
        icon: 'warning',
        title: 'Empty Cart',
        text: 'Please add items to your cart before confirming the order.',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    if (!this.bookingId || !this.roomId) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Details',
        text: 'Room and booking information are missing. Please re-select your room.',
        confirmButtonColor: '#2563eb',
      }).then(() => {
        this.router.navigate(['/customer/food']);
      });
      return;
    }

    // Convert cart to DTO class consisting of bookingid, roomid and list of fooditems
    const orderDto = new FoodOrder(
      this.bookingId,
      this.roomId,
      rawCartItems
    );

    Swal.fire({
      title: 'Confirm Food Order',
      html: `
        <div style="text-align: left; padding: 0 10px;">
          <p><strong>Deliver to:</strong> Room ${this.roomNumber} (Booking #${this.bookingId})</p>
          <p><strong>Total Items:</strong> ${rawCartItems.length}</p>
          <p><strong>Total Amount:</strong> ₹${this.grandTotal()}</p>
          ${this.specialInstructions ? `<p><strong>Instructions:</strong> "${this.specialInstructions}"</p>` : ''}
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Confirm Order',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#0f4c81',
      cancelButtonColor: '#64748b',
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Processing Order...',
          text: 'Sending your order details to the kitchen.',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        this.foodOrderService.foodOrderApiCall(orderDto).subscribe({
          next: (response: any) => {
            Swal.fire({
              icon: 'success',
              title: 'Order Placed!',
              text: response.message || 'Your order has been successfully sent to the kitchen.',
              confirmButtonText: 'Great!',
              confirmButtonColor: '#0f4c81',
            }).then(() => {
              this.foodMenuService.clearCart();
              this.router.navigate(['/customer/food']);
            });
          },
          error: (err: any) => {
            Swal.fire({
              icon: 'error',
              title: 'Order Failed',
              text: err.error?.message || err.message || 'An error occurred while placing your food order. Please try again.',
              confirmButtonText: 'OK',
              confirmButtonColor: '#2563eb',
            });
          },
        });
      }
    });
  }
}
