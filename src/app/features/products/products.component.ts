import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { CategoryService } from '../../core/services/category.service';
import { SeoService } from '../../core/services/seo.service';
import { IProduct } from '../../core/models/product.model';
import { ICategory } from '../../core/models/category.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { ProductFilterComponent } from './components/product-filter/product-filter.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

const ITEMS_PER_PAGE = 36;

export interface PriceRange {
  label: string;
  min: number;
  max: number;
  count: number;
}

@Component({
  selector: 'app-products',
  imports: [ProductCardComponent, SkeletonLoaderComponent, ProductFilterComponent, PaginationComponent, TranslatePipe, FormsModule, NgTemplateOutlet],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private categoryService = inject(CategoryService);
  private seoService = inject(SeoService);

  products: IProduct[] = [];
  allFetchedProducts: IProduct[] = []; // unfiltered products from server for computing counts
  categories: ICategory[] = [];

  selectedCategory = '';
  selectedSubcategory = '';
  selectedBrand = '';
  sortBy = 'default';
  searchTerm = '';
  selectedFilterTags: string[] = [];

  currentPage = 1;
  totalPages = 1;
  totalProducts = 0;

  isLoading = signal(true);
  showFilterDrawer = false;

  // Sidebar filter state
  sidebarSections: Record<string, boolean> = {
    price: true,
    availability: true,
    brand: true,
    filterTags: true,
    sort: true,
  };

  // Price range filters
  priceRanges: PriceRange[] = [
    { label: 'من 0 إلى 500', min: 0, max: 500, count: 0 },
    { label: 'من 500 إلى 1000', min: 500, max: 1000, count: 0 },
    { label: 'من 1000 إلى 1500', min: 1000, max: 1500, count: 0 },
    { label: 'من 1500 إلى 2000', min: 1500, max: 2000, count: 0 },
    { label: 'من 2000 إلى 2500', min: 2000, max: 2500, count: 0 },
    { label: 'من 2500 إلى 3000', min: 2500, max: 3000, count: 0 },
    { label: 'من 3000 إلى 3500', min: 3000, max: 3500, count: 0 },
  ];
  selectedPriceRanges: PriceRange[] = [];

  // Availability filters
  availabilityFilters = [
    { label: 'متوفر', value: 'in-stock', count: 0 },
    { label: 'غير متوفر', value: 'out-of-stock', count: 0 },
  ];
  selectedAvailability: string[] = [];

  // Brand filters
  brandList: { name: string; count: number }[] = [];
  filteredBrandList: { name: string; count: number }[] = [];
  brandSearchTerm = '';
  selectedBrands: string[] = [];

  get activeFilterCount(): number {
    let count = 0;
    if (this.selectedCategory) count++;
    if (this.selectedBrand) count++;
    if (this.searchTerm) count++;
    if (this.sortBy !== 'default') count++;
    count += this.selectedFilterTags.length;
    count += this.selectedPriceRanges.length;
    count += this.selectedAvailability.length;
    count += this.selectedBrands.length;
    return count;
  }

  get activeFilters(): { label: string; type: string; value: string }[] {
    const filters: { label: string; type: string; value: string }[] = [];

    if (this.selectedBrand) {
      filters.push({ label: this.selectedBrand, type: 'brand-param', value: this.selectedBrand });
    }
    for (const pr of this.selectedPriceRanges) {
      filters.push({ label: pr.label, type: 'price', value: pr.label });
    }
    for (const av of this.selectedAvailability) {
      const found = this.availabilityFilters.find(a => a.value === av);
      if (found) filters.push({ label: found.label, type: 'availability', value: av });
    }
    for (const b of this.selectedBrands) {
      filters.push({ label: b, type: 'brand', value: b });
    }
    for (const tag of this.selectedFilterTags) {
      filters.push({ label: tag, type: 'filterTag', value: tag });
    }
    return filters;
  }

  get availableFilterTags(): string[] {
    if (!this.selectedCategory) return [];
    const cat = this.categories.find(c => c.slug === this.selectedCategory);
    return cat?.filterTags || [];
  }

  get pageTitle(): string {
    const cat = this.categories.find(c => c.slug === this.selectedCategory);
    if (!cat) return '';
    if (this.selectedSubcategory && cat.subcategories) {
      const sub = cat.subcategories.find(s => s.slug === this.selectedSubcategory);
      if (sub?.name) return `${cat.name} - ${sub.name}`;
    }
    return cat.name;
  }

  openFilterDrawer(): void {
    this.showFilterDrawer = true;
    this.cdr.markForCheck();
  }

  closeFilterDrawer(): void {
    this.showFilterDrawer = false;
    this.cdr.markForCheck();
  }

  toggleSection(section: string): void {
    this.sidebarSections[section] = !this.sidebarSections[section];
  }

  ngOnInit(): void {
    this.seoService.setPageMeta({
      title: 'المنتجات',
      description: 'تصفح جميع المنتجات المتاحة بأفضل الأسعار. فلاتر متقدمة للبحث حسب القسم والعلامة التجارية.',
      path: '/products',
    });
    this.categoryService.getAll().subscribe(c => {
      this.categories = c;
      this.cdr.markForCheck();
    });

    this.route.queryParams.subscribe(params => {
      this.selectedCategory = params['category'] || '';
      this.selectedSubcategory = params['subcategory'] || '';
      this.selectedBrand = params['brand'] || '';
      this.searchTerm = params['search'] || '';
      this.currentPage = 1;
      this.fetchFromServer();
    });
  }

  onCategoryChange(category: string): void {
    this.selectedFilterTags = [];
    this.closeFilterDrawer();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: category || null, subcategory: null },
      queryParamsHandling: 'merge',
    });
  }

  onSubcategoryChange(subcategory: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { subcategory: subcategory || null },
      queryParamsHandling: 'merge',
    });
  }

  onFilterTagsChange(tags: string[]): void {
    this.selectedFilterTags = tags;
    this.currentPage = 1;
    this.applyClientFilters();
  }

  onSortChange(sort: string): void {
    this.sortBy = sort;
    this.currentPage = 1;
    this.closeFilterDrawer();
    this.applyClientFilters();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.closeFilterDrawer();
    this.fetchFromServer();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.fetchFromServer();
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Price range toggle
  togglePriceRange(range: PriceRange): void {
    const idx = this.selectedPriceRanges.indexOf(range);
    if (idx >= 0) {
      this.selectedPriceRanges.splice(idx, 1);
    } else {
      this.selectedPriceRanges.push(range);
    }
    this.currentPage = 1;
    this.applyClientFilters();
  }

  isPriceRangeSelected(range: PriceRange): boolean {
    return this.selectedPriceRanges.includes(range);
  }

  // Availability toggle
  toggleAvailability(value: string): void {
    const idx = this.selectedAvailability.indexOf(value);
    if (idx >= 0) {
      this.selectedAvailability.splice(idx, 1);
    } else {
      this.selectedAvailability.push(value);
    }
    this.currentPage = 1;
    this.applyClientFilters();
  }

  isAvailabilitySelected(value: string): boolean {
    return this.selectedAvailability.includes(value);
  }

  // Brand toggle
  toggleBrand(brand: string): void {
    const idx = this.selectedBrands.indexOf(brand);
    if (idx >= 0) {
      this.selectedBrands.splice(idx, 1);
    } else {
      this.selectedBrands.push(brand);
    }
    this.currentPage = 1;
    this.applyClientFilters();
  }

  isBrandSelected(brand: string): boolean {
    return this.selectedBrands.includes(brand);
  }

  onBrandSearch(term: string): void {
    this.brandSearchTerm = term;
    this.filteredBrandList = this.brandList.filter(b =>
      b.name.toLowerCase().includes(term.toLowerCase())
    );
  }

  // Filter tag toggle (used in sidebar)
  toggleFilterTag(tag: string): void {
    const current = [...this.selectedFilterTags];
    const idx = current.indexOf(tag);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(tag);
    }
    this.onFilterTagsChange(current);
  }

  // Remove active filter
  removeFilter(filter: { label: string; type: string; value: string }): void {
    switch (filter.type) {
      case 'price':
        this.selectedPriceRanges = this.selectedPriceRanges.filter(pr => pr.label !== filter.value);
        break;
      case 'availability':
        this.selectedAvailability = this.selectedAvailability.filter(a => a !== filter.value);
        break;
      case 'brand':
        this.selectedBrands = this.selectedBrands.filter(b => b !== filter.value);
        break;
      case 'brand-param':
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { brand: null },
          queryParamsHandling: 'merge',
        });
        return;
      case 'filterTag':
        this.selectedFilterTags = this.selectedFilterTags.filter(t => t !== filter.value);
        break;
    }
    this.currentPage = 1;
    this.applyClientFilters();
  }

  clearAllFilters(): void {
    this.selectedPriceRanges = [];
    this.selectedAvailability = [];
    this.selectedBrands = [];
    this.selectedFilterTags = [];
    this.brandSearchTerm = '';
    this.currentPage = 1;
    if (this.selectedBrand) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { brand: null },
        queryParamsHandling: 'merge',
      });
    } else {
      this.applyClientFilters();
    }
  }

  private fetchFromServer(): void {
    this.isLoading.set(true);

    this.productService.searchProducts({
      search: this.searchTerm || undefined,
      category: this.selectedCategory || undefined,
      subcategory: this.selectedSubcategory || undefined,
      brand: this.selectedBrand || undefined,
      filterTags: this.selectedFilterTags.length ? this.selectedFilterTags : undefined,
      page: this.currentPage,
      limit: ITEMS_PER_PAGE,
    }).subscribe(result => {
      this.allFetchedProducts = result.products;
      this.computeFilterCounts(result.products);
      this.applyClientFiltersInternal(result.products, result.total);
      this.isLoading.set(false);
      this.cdr.markForCheck();
    });
  }

  private applyClientFilters(): void {
    this.applyClientFiltersInternal(this.allFetchedProducts, this.allFetchedProducts.length);
    this.cdr.markForCheck();
  }

  private applyClientFiltersInternal(serverProducts: IProduct[], serverTotal: number): void {
    let filtered = [...serverProducts];

    // Apply price range filter
    if (this.selectedPriceRanges.length > 0) {
      filtered = filtered.filter(p =>
        this.selectedPriceRanges.some(r => p.price >= r.min && p.price < r.max)
      );
    }

    // Apply availability filter
    if (this.selectedAvailability.length > 0) {
      filtered = filtered.filter(p => {
        if (this.selectedAvailability.includes('in-stock') && p.stock > 0) return true;
        if (this.selectedAvailability.includes('out-of-stock') && p.stock === 0) return true;
        return false;
      });
    }

    // Apply brand filter (sidebar brands, not URL brand param)
    if (this.selectedBrands.length > 0) {
      filtered = filtered.filter(p => this.selectedBrands.includes(p.brand));
    }

    this.products = this.applySorting(filtered);
    this.totalProducts = filtered.length;
    this.totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  }

  private computeFilterCounts(products: IProduct[]): void {
    // Price range counts
    for (const range of this.priceRanges) {
      range.count = products.filter(p => p.price >= range.min && p.price < range.max).length;
    }

    // Availability counts
    this.availabilityFilters[0].count = products.filter(p => p.stock > 0).length;
    this.availabilityFilters[1].count = products.filter(p => p.stock === 0).length;

    // Brand counts
    const brandMap = new Map<string, number>();
    for (const p of products) {
      if (p.brand) {
        brandMap.set(p.brand, (brandMap.get(p.brand) || 0) + 1);
      }
    }
    this.brandList = Array.from(brandMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    this.filteredBrandList = this.brandSearchTerm
      ? this.brandList.filter(b => b.name.toLowerCase().includes(this.brandSearchTerm.toLowerCase()))
      : [...this.brandList];
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
