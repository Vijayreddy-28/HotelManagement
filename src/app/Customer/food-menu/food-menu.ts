import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FoodMenuService } from '../../../services/foodmenu.service';
import { FoodMenu, FoodCategory } from '../../../models/foodmenu.model';
import { ToastrService } from 'ngx-toastr';

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
  isLoading = signal<boolean>(false);
  searchQuery = signal<string>('');
  activeCategory = signal<string>('All');

  priceSort = signal<string>('default'); // 'default', 'asc', 'desc'
  currentPage = signal<number>(1);
  pageSize = 8;

  constructor(
    public foodMenuService: FoodMenuService,
    private router: Router,
    private toastr: ToastrService,
  ) { }

  ngOnInit() {
    this.loadFoodMenu();
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
        this.toastr.error('We are currently unable to retrieve the menu. Please try again later.', 'Failed to Load Menu');
        this.isLoading.set(false);
      },
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

  paginatedItems = computed(() => {
    const list = this.filteredItems();
    const start = (this.currentPage() - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredItems().length / this.pageSize) || 1;
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
    this.currentPage.set(1);
  }


  // Set sorting
  setPriceSort(sort: string) {
    this.priceSort.set(sort);
    this.currentPage.set(1);
  }

  // Update search input
  onSearch(query: string) {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  // Get banner CSS class based on category
  getBannerClass(category: string): string {
    return `cat-${category.toLowerCase().replace(/\s+/g, '-')}`;
  }

  // Resolve Food Image URL to backend or fallback defaults
  getFoodImageUrl(item: FoodMenu): string {
    if (!item.imageUrl) {
      // Default fallback images based on category
      switch (item.category.toLowerCase()) {
        case 'breakfast': return 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=300&q=80';
        case 'maincourse': return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&q=80';
        case 'snacks': return 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=300&q=80';
        case 'beverage': return 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&w=300&q=80';
        case 'dessert': return 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=300&q=80';
        default: return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';
      }
    }
    // Prepend API base host if it's a relative path
    if (item.imageUrl.startsWith('uploads') || item.imageUrl.startsWith('images') || item.imageUrl.startsWith('/uploads') || item.imageUrl.startsWith('/images')) {
      const path = item.imageUrl.startsWith('/') ? item.imageUrl.substring(1) : item.imageUrl;
      return `http://localhost:5149/${path}`;
    }
    return item.imageUrl;
  }


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

  placeOrder() {
    if (this.cartCount() === 0) {
      this.toastr.warning('Please add items to your order before placing it.', 'Empty Cart');
      return;
    }
    this.router.navigate(['/customer/foodcart']);
  }
}
