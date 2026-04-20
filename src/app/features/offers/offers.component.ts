import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { BannerService } from '../../core/services/banner.service';
import { CategoryService } from '../../core/services/category.service';
import { TranslationService } from '../../core/services/translation.service';
import { SeoService } from '../../core/services/seo.service';
import { IProduct } from '../../core/models/product.model';
import { IBanner } from '../../core/models/banner.model';
import { ICategory } from '../../core/models/category.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { LightRaysComponent } from './light-rays.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

const ITEMS_PER_PAGE = 36;

interface PriceRange {
  label: string;
  min: number;
  max: number;
  count: number;
}

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [RouterLink, FormsModule, NgTemplateOutlet, ProductCardComponent, PaginationComponent, LightRaysComponent, TranslatePipe],
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
  private categoryService = inject(CategoryService);
  private seoService = inject(SeoService);

  banners = signal<IBanner[]>([]);
  products: IProduct[] = [];
  allFetchedProducts: IProduct[] = [];
  categories: ICategory[] = [];
  isLoading = signal(true);
  selectedCategory = '';
  sortBy = 'default';

  currentPage = 1;
  totalPages = 1;
  totalProducts = 0;

  showFilterDrawer = false;

  sidebarSections: Record<string, boolean> = {
    sort: true,
    price: true,
    availability: true,
    brand: true,
    category: true,
  };

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

  availabilityFilters = [
    { label: 'متوفر', value: 'in-stock', count: 0 },
    { label: 'غير متوفر', value: 'out-of-stock', count: 0 },
  ];
  selectedAvailability: string[] = [];

  brandList: { name: string; count: number }[] = [];
  filteredBrandList: { name: string; count: number }[] = [];
  brandSearchTerm = '';
  selectedBrands: string[] = [];

  categoryCounts: { slug: string; name: string; count: number }[] = [];

  private readonly baseDiscountImages = [
    { src: '/assets/offers/10-removebg-preview.png', alt: '10% خصم' },
    { src: '/assets/offers/20-removebg-preview.png', alt: '20% خصم' },
    { src: '/assets/offers/30-removebg-preview.png', alt: '30% خصم' },
    { src: '/assets/offers/40-removebg-preview.png', alt: '40% خصم' },
    { src: '/assets/offers/images-removebg-preview_LE_upscale_prime_light_ai_100_remove_background_general_clip_to_object_off.png', alt: 'تخفيضات' },
  ];

  readonly marqueeSet = Array.from({ length: 20 }, () => this.baseDiscountImages).flat();

  get activeFilterCount(): number {
    let count = 0;
    if (this.selectedCategory) count++;
    if (this.sortBy !== 'default') count++;
    count += this.selectedPriceRanges.length;
    count += this.selectedAvailability.length;
    count += this.selectedBrands.length;
    return count;
  }

  get activeFilters(): { label: string; type: string; value: string }[] {
    const filters: { label: string; type: string; value: string }[] = [];

    if (this.selectedCategory) {
      const cat = this.categories.find(c => c.slug === this.selectedCategory);
      filters.push({ label: cat?.name || this.selectedCategory, type: 'category', value: this.selectedCategory });
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
    return filters;
  }

  ngOnInit(): void {
    this.seoService.setPageMeta({
      title: 'العروض والخصومات',
      description: 'اكتشف أقوى العروض والخصومات على جميع المنتجات. وفر أكثر مع عروض حصرية يومية.',
      path: '/offers',
    });
    this.bannerService.getByPage('offers').subscribe(b => this.banners.set(b));
    this.categoryService.getAll().subscribe(c => {
      this.categories = c;
      this.cdr.markForCheck();
    });
    this.fetchFromServer();
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

  onCategorySelect(category: string): void {
    this.selectedCategory = category;
    this.currentPage = 1;
    this.closeFilterDrawer();
    this.fetchFromServer();
  }

  onSortChange(value: string): void {
    this.sortBy = value;
    this.currentPage = 1;
    this.closeFilterDrawer();
    this.applyClientFilters();
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

  removeFilter(filter: { label: string; type: string; value: string }): void {
    switch (filter.type) {
      case 'category':
        this.selectedCategory = '';
        this.currentPage = 1;
        this.fetchFromServer();
        return;
      case 'price':
        this.selectedPriceRanges = this.selectedPriceRanges.filter(pr => pr.label !== filter.value);
        break;
      case 'availability':
        this.selectedAvailability = this.selectedAvailability.filter(a => a !== filter.value);
        break;
      case 'brand':
        this.selectedBrands = this.selectedBrands.filter(b => b !== filter.value);
        break;
    }
    this.currentPage = 1;
    this.applyClientFilters();
  }

  clearAllFilters(): void {
    this.selectedPriceRanges = [];
    this.selectedAvailability = [];
    this.selectedBrands = [];
    this.brandSearchTerm = '';
    this.currentPage = 1;
    if (this.selectedCategory) {
      this.selectedCategory = '';
      this.fetchFromServer();
    } else {
      this.applyClientFilters();
    }
  }

  get showingStart(): number {
    return this.totalProducts === 0 ? 0 : (this.currentPage - 1) * ITEMS_PER_PAGE + 1;
  }

  get showingEnd(): number {
    return Math.min(this.currentPage * ITEMS_PER_PAGE, this.totalProducts);
  }

  formatCategoryName(slug: string): string {
    const cat = this.categories.find(c => c.slug === slug);
    return cat?.name || slug.replaceAll('-', ' ');
  }

  private fetchFromServer(): void {
    this.isLoading.set(true);

    this.productService.searchProducts({
      hasDiscount: true,
      category: this.selectedCategory || undefined,
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

    if (this.selectedPriceRanges.length > 0) {
      filtered = filtered.filter(p =>
        this.selectedPriceRanges.some(r => p.price >= r.min && p.price < r.max)
      );
    }

    if (this.selectedAvailability.length > 0) {
      filtered = filtered.filter(p => {
        if (this.selectedAvailability.includes('in-stock') && p.stock > 0) return true;
        if (this.selectedAvailability.includes('out-of-stock') && p.stock === 0) return true;
        return false;
      });
    }

    if (this.selectedBrands.length > 0) {
      filtered = filtered.filter(p => this.selectedBrands.includes(p.brand));
    }

    this.products = this.applySorting(filtered);
    this.totalProducts = filtered.length;
    this.totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  }

  private computeFilterCounts(products: IProduct[]): void {
    for (const range of this.priceRanges) {
      range.count = products.filter(p => p.price >= range.min && p.price < range.max).length;
    }

    this.availabilityFilters[0].count = products.filter(p => p.stock > 0).length;
    this.availabilityFilters[1].count = products.filter(p => p.stock === 0).length;

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

    if (!this.selectedCategory) {
      const catMap = new Map<string, number>();
      for (const p of products) {
        if (p.category) catMap.set(p.category, (catMap.get(p.category) || 0) + 1);
      }
      this.categoryCounts = Array.from(catMap.entries())
        .map(([slug, count]) => ({ slug, name: this.formatCategoryName(slug), count }))
        .sort((a, b) => b.count - a.count);
    }
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
