import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { CategoryService } from '../../core/services/category.service';
import { IProduct } from '../../core/models/product.model';
import { ICategory } from '../../core/models/category.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { ProductFilterComponent } from './components/product-filter/product-filter.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

const ITEMS_PER_PAGE = 36;

@Component({
  selector: 'app-products',
  imports: [ProductCardComponent, SkeletonLoaderComponent, ProductFilterComponent, PaginationComponent, TranslatePipe, RouterLink],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private categoryService = inject(CategoryService);

  products: IProduct[] = [];
  categories: ICategory[] = [];

  selectedCategory = '';
  selectedBrand = '';
  sortBy = 'default';
  searchTerm = '';
  selectedFilterTags: string[] = [];

  currentPage = 1;
  totalPages = 1;
  totalProducts = 0;

  isLoading = signal(true);

  ngOnInit(): void {
    this.categoryService.getAll().subscribe(c => this.categories = c);

    this.route.queryParams.subscribe(params => {
      this.selectedCategory = params['category'] || '';
      this.selectedBrand = params['brand'] || '';
      this.searchTerm = params['search'] || '';
      this.currentPage = 1;
      this.fetchFromServer();
    });
  }

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.selectedFilterTags = [];
    this.currentPage = 1;
    this.fetchFromServer();
  }

  onFilterTagsChange(tags: string[]): void {
    this.selectedFilterTags = tags;
    this.currentPage = 1;
    this.fetchFromServer();
  }

  onSortChange(sort: string): void {
    this.sortBy = sort;
    this.currentPage = 1;
    this.fetchFromServer();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
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
      search: this.searchTerm || undefined,
      category: this.selectedCategory || undefined,
      brand: this.selectedBrand || undefined,
      filterTags: this.selectedFilterTags.length ? this.selectedFilterTags : undefined,
      page: this.currentPage,
      limit: ITEMS_PER_PAGE,
    }).subscribe(result => {
      this.products = this.applySorting(result.products);
      this.totalProducts = result.total;
      this.totalPages = Math.max(1, Math.ceil(result.total / ITEMS_PER_PAGE));
      this.isLoading.set(false);
      this.cdr.markForCheck();
    });
  }

  private applySorting(products: IProduct[]): IProduct[] {
    const result = [...products];
    switch (this.sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name-az':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
    }
    return result;
  }
}
