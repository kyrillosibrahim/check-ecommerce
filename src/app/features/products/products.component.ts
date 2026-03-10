import { ChangeDetectorRef, Component, inject, OnInit, OnDestroy, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
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
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-products',
  imports: [ProductCardComponent, SkeletonLoaderComponent, ProductFilterComponent, TranslatePipe, RouterLink],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit, AfterViewInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private categoryService = inject(CategoryService);

  @ViewChild('scrollSentinel') scrollSentinel!: ElementRef<HTMLDivElement>;
  private observer: IntersectionObserver | null = null;

  allProducts: IProduct[] = [];
  filteredProducts: IProduct[] = [];
  displayedProducts: IProduct[] = [];
  categories: ICategory[] = [];

  selectedCategory = '';
  selectedBrand = '';
  sortBy = 'default';
  searchTerm = '';
  selectedFilterTags: string[] = [];
  itemsPerLoad = 20;
  displayedCount = 0;
  isLoading = signal(true);
  isLoadingMore = signal(false);

  get hasMore(): boolean {
    return this.displayedCount < this.filteredProducts.length;
  }

  ngOnInit(): void {
    this.categoryService.getAll().subscribe(c => this.categories = c);

    this.route.queryParams.subscribe(params => {
      this.selectedCategory = params['category'] || '';
      this.selectedBrand = params['brand'] || '';
      this.searchTerm = params['search'] || '';
      this.fetchFromServer();
    });
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.selectedFilterTags = [];
    this.fetchFromServer();
  }

  onFilterTagsChange(tags: string[]): void {
    this.selectedFilterTags = tags;
    this.fetchFromServer();
  }

  onSortChange(sort: string): void {
    this.sortBy = sort;
    this.applySortAndPaginate();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.fetchFromServer();
  }

  onAddToCart(product: IProduct): void {
    this.cartService.addToCart(product);
  }

  onAddToWishlist(product: IProduct): void {
    this.wishlistService.addToWishlist(product);
  }

  loadMore(): void {
    if (!this.hasMore || this.isLoadingMore()) return;
    this.isLoadingMore.set(true);

    setTimeout(() => {
      this.displayedCount = Math.min(this.displayedCount + this.itemsPerLoad, this.filteredProducts.length);
      this.displayedProducts = this.filteredProducts.slice(0, this.displayedCount);
      this.isLoadingMore.set(false);
    }, 300);
  }

  /** Fetch products from backend with current filters */
  private fetchFromServer(): void {
    this.isLoading.set(true);
    this.displayedCount = 0;

    this.productService.searchProducts({
      search: this.searchTerm || undefined,
      category: this.selectedCategory || undefined,
      brand: this.selectedBrand || undefined,
      filterTags: this.selectedFilterTags.length ? this.selectedFilterTags : undefined,
    }).subscribe(products => {
      this.allProducts = products;
      this.applySortAndPaginate();
      this.isLoading.set(false);
      this.cdr.markForCheck();
    });
  }

  /** Apply client-side sorting and pagination */
  private applySortAndPaginate(): void {
    let result = [...this.allProducts];

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

    this.filteredProducts = result;
    this.displayedCount = Math.min(this.itemsPerLoad, result.length);
    this.displayedProducts = result.slice(0, this.displayedCount);
  }

  private setupIntersectionObserver(): void {
    this.observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && this.hasMore && !this.isLoading() && !this.isLoadingMore()) {
        this.loadMore();
      }
    }, { threshold: 0.1 });

    if (this.scrollSentinel) {
      this.observer.observe(this.scrollSentinel.nativeElement);
    }
  }
}
