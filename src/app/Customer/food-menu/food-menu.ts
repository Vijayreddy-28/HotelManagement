import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FoodMenuService } from '../../../services/foodmenu.service';
import { RoomBookingService } from '../../../services/roombooking.service';
import { FoodMenu, FoodCategory } from '../../../models/foodmenu.model';
import Swal from 'sweetalert2';
import { CurrentRooms } from '../../../models/room.model';

interface RoomSelectionOption {
  bookingId: number;
  roomId: number;
  roomNumber: number;
}

@Component({
  selector: 'app-food-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './food-menu.html',
  styleUrl: './food-menu.css',
})
export class FoodMenuComponent implements OnInit {
  // Food items state using actual FoodMenu model
  foodItems = signal<FoodMenu[]>([]);
  bookingRooms = signal<CurrentRooms[]>([]);
  isLoading = signal<boolean>(false);
  searchQuery = signal<string>('');
  activeCategory = signal<string>('All');

  priceSort = signal<string>('default'); // 'default', 'asc', 'desc'

  // Cart Drawer Visibility
  showCart = signal<boolean>(false);
  specialInstructions = '';

  // Floating Room Selection Modal
  showRoomModal = signal<boolean>(false);
  loadingBookings = signal<boolean>(false);
  selectedBookingOption = ''; // formatted as "bookingId-roomId-roomNumber"

  constructor(
    public foodMenuService: FoodMenuService,
    private roomBookingService: RoomBookingService,
    private router: Router,
  ) { }

  ngOnInit() {
    this.loadFoodMenu();
    this.loadCustomerBookings();
  }

  // Load menu items from backend API
  loadFoodMenu() {
    this.isLoading.set(true);
    this.foodMenuService.getFoodMenu(1, 30).subscribe({
      next: (response: any) => {
        const rawItems = response.data || [];
        const items = rawItems.map((raw: any) => {
          const item = new FoodMenu(
            raw.itemId,
            raw.itemName?.trim(),
            raw.category,
            raw.price,
            raw.imageUrl,
          );
          // Resolve numeric category enum to string name
          const categoryNum = typeof raw.category === 'number' ? raw.category : parseInt(raw.category, 10);
          item.category = FoodCategory[categoryNum] ?? raw.category ?? 'Other';

          item.description =
            raw.description ||
            `Freshly prepared ${raw.itemName?.trim() || 'dish'} made with selected ingredients.`;
          item.isAvailable = true;

          return item;
        });
        this.foodItems.set(items);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch food items from API:', err);
        Swal.fire({
          icon: 'error',
          title: 'Failed to Load Menu',
          text: 'We are currently unable to retrieve the menu. Please try again later.',
          confirmButtonColor: '#2563eb',
        });
        this.isLoading.set(false);
      },
    });
  }



  // Load customer bookings to populate room numbers
  loadCustomerBookings() {
    this.loadingBookings.set(true);
    this.roomBookingService.getMyBookings().subscribe({
      next: (response: any) => {
        this.bookingRooms.set(response);
        this.loadingBookings.set(false);
      },
      error: (error) => {
        this.loadingBookings.set(false);
      }
    });
  }

  // Get dynamic categories list
  categories = computed(() => {
    const cats = new Set(this.foodItems().map((item) => item.category));
    return ['All', ...Array.from(cats)];
  });

  // Filter, Search, and Sort items
  filteredItems = computed(() => {
    let items = this.foodItems();

    // 1. Search Query Filter
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      items = items.filter(
        (item) =>
          item.itemName.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query),
      );
    }

    // 2. Category Filter
    const cat = this.activeCategory();
    if (cat !== 'All') {
      items = items.filter((item) => item.category === cat);
    }

    // 3. Price Sorting
    const sort = this.priceSort();
    if (sort === 'asc') {
      items = [...items].sort((a, b) => a.price - b.price);
    } else if (sort === 'desc') {
      items = [...items].sort((a, b) => b.price - a.price);
    }

    return items;
  });

  // Get icons for category pills
  getCatIcon(cat: string): string {
    switch (cat.toLowerCase()) {
      case 'breakfast':
        return 'bi bi-egg-fried';
      case 'maincourse':
        return 'bi bi-bowl-hot';
      case 'snacks':
        return 'bi bi-cookie';
      case 'beverage':
        return 'bi bi-cup-hot';
      case 'dessert':
        return 'bi bi-cake2';
      case 'starter':
        return 'bi bi-stars';
      default:
        return 'bi bi-funnel';
    }
  }

  // Set category
  setCategory(cat: string) {
    this.activeCategory.set(cat);
  }


  // Set sorting
  setPriceSort(sort: string) {
    this.priceSort.set(sort);
  }

  // Update search input
  onSearch(query: string) {
    this.searchQuery.set(query);
  }

  // Get banner CSS class based on category
  getBannerClass(category: string): string {
    return `cat-${category.toLowerCase().replace(/\s+/g, '-')}`;
  }

  // Grouped cart items that the template expects
  cartItems = computed(() => {
    const items = this.foodMenuService.cartItems();
    const groups = new Map<number, any>();
    for (const item of items) {
      if (groups.has(item.itemId)) {
        groups.get(item.itemId).quantity++;
      } else {
        groups.set(item.itemId, {
          itemId: item.itemId,
          itemName: item.itemName,
          category: item.category,
          price: item.price,
          imageUrl: item.imageUrl,
          isVeg: item.isVeg || false,
          description: item.description || '',
          quantity: 1,
        });
      }
    }
    return Array.from(groups.values());
  });

  cartCount = computed(() => {
    return this.foodMenuService.cartItems().length;
  });

  cartTotal = computed(() => {
    return this.foodMenuService.cartItems().reduce((total, item) => total + item.price, 0);
  });

  getQuantityInCart(itemId: number): number {
    return this.foodMenuService.cartItems().filter((item) => item.itemId === itemId).length;
  }

  addToCart(item: any) {
    this.foodMenuService.addToCart(item);
  }

  removeFromCart(itemId: number) {
    this.foodMenuService.removeCart(itemId);
  }

  removeItemCompletely(itemId: number) {
    this.foodMenuService.removeItemCompletely(itemId);
  }

  getMenuItem(itemId: number): FoodMenu | undefined {
    return this.foodItems().find((item) => item.itemId === itemId);
  }

  toggleCart() {
    this.showCart.update((prev) => !prev);
  }

  // Floating modal operations
  placeOrder() {
    // Hide cart side drawer
    this.showCart.set(false);

    // Check if cart is empty
    if (this.cartCount() === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Empty Cart',
        text: 'Please add items to your order before placing it.',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    // Show room number selection modal
    this.showRoomModal.set(true);
  }

  closeRoomModal() {
    this.showRoomModal.set(false);
  }

  confirmRoomSelection() {
    const selectedVal = this.selectedBookingOption;
    if (!selectedVal) {
      Swal.fire({
        icon: 'warning',
        title: 'Selection Required',
        text: 'Please select your room and booking details before proceeding.',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    // Value format: "bookingId-roomId-roomNumber"
    const [bookingIdStr, roomIdStr, roomNumberStr] = selectedVal.split('-');
    const bookingId = parseInt(bookingIdStr, 10);
    const roomId = parseInt(roomIdStr, 10);
    const roomNumber = parseInt(roomNumberStr, 10);

    // Save in service
    this.foodMenuService.selectedBookingId.set(bookingId);
    this.foodMenuService.selectedRoomId.set(roomId);
    this.foodMenuService.selectedRoomNumber.set(roomNumber);

    // Close modal & navigate to Food Cart (FoodOrder component)
    this.showRoomModal.set(false);
    this.router.navigate(['/customer/foodcart']);
  }
}
