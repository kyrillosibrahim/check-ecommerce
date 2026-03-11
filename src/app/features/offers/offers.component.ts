import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { BannerService } from '../../core/services/banner.service';
import { TranslationService } from '../../core/services/translation.service';
import { IProduct } from '../../core/models/product.model';
import { IBanner } from '../../core/models/banner.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { LightRaysComponent } from './light-rays.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

const ITEMS_PER_PAGE = 36;

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [RouterLink, FormsModule, ProductCardComponent, PaginationComponent, LightRaysComponent, TranslatePipe],
  templateUrl: './offers.component.html',
  styleUrl: './offers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OffersComponent implements OnInit {
  translationService = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private bannerService = inject(BannerService);

  banners = signal<IBanner[]>([]);
  products: IProduct[] = [];
  isLoading = signal(true);
  selectedCategory = '';
  sortBy = 'default';

  currentPage = 1;
  totalPages = 1;
  totalProducts = 0;

  availableCategories: string[] = [];

  ngOnInit(): void {
    this.bannerService.getByPage('offers').subscribe(b => this.banners.set(b));
    this.fetchFromServer();
  }

  onCategorySelect(category: string): void {
    this.selectedCategory = category;
    this.currentPage = 1;
    this.fetchFromServer();
  }

  onSortChange(value: string): void {
    this.sortBy = value;
    this.currentPage = 1;
    this.fetchFromServer();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.fetchFromServer();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onAddToCart(product: IProduct): void {
    this.cartService.addToCart(product);
  }

  onAddToWishlist(product: IProduct): void {
    this.wishlistService.addToWishlist(product);
  }

  get showingStart(): number {
    return this.totalProducts === 0 ? 0 : (this.currentPage - 1) * ITEMS_PER_PAGE + 1;
  }

  get showingEnd(): number {
    return Math.min(this.currentPage * ITEMS_PER_PAGE, this.totalProducts);
  }

  private fetchFromServer(): void {
    this.isLoading.set(true);

    this.productService.searchProducts({
      hasDiscount: true,
      category: this.selectedCategory || undefined,
      page: this.currentPage,
      limit: ITEMS_PER_PAGE,
    }).subscribe(result => {
      this.products = this.applySorting(result.products);
      this.totalProducts = result.total;
      this.totalPages = Math.max(1, Math.ceil(result.total / ITEMS_PER_PAGE));

      // Extract unique categories from first page results for filter chips
      if (this.currentPage === 1 && !this.selectedCategory) {
        const seen = new Set<string>();
        this.availableCategories = result.products
          .map(p => p.category)
          .filter(cat => {
            if (!cat || seen.has(cat)) return false;
            seen.add(cat);
            return true;
          });
      }

      this.isLoading.set(false);
      this.cdr.markForCheck();
    });
  }

  formatCategoryName(slug: string): string {
    return slug.replaceAll('-', ' ');
  }

  private applySorting(products: IProduct[]): IProduct[] {
    const result = [...products];
    switch (this.sortBy) {
      case 'discount-high':
        result.sort((a, b) => b.discountPercentage - a.discountPercentage);
        break;
      case 'discount-low':
        result.sort((a, b) => a.discountPercentage - b.discountPercentage);
        break;
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
    }
    return result;
  }
}
