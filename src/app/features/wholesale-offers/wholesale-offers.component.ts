import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { WholesaleOfferService } from '../../core/services/wholesale-offer.service';
import { CartService } from '../../core/services/cart.service';
import { IProduct } from '../../core/models/product.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { TranslationService } from '../../core/services/translation.service';

interface PriceRange {
  label: string;
  min: number;
  max: number;
}

@Component({
  selector: 'app-wholesale-offers',
  imports: [FormsModule, NgTemplateOutlet, ProductCardComponent, SkeletonLoaderComponent, TranslatePipe],
  templateUrl: './wholesale-offers.component.html',
  styleUrl: './wholesale-offers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WholesaleOffersComponent implements OnInit {
  private wholesaleService = inject(WholesaleOfferService);
  private cartService = inject(CartService);
  private cdr = inject(ChangeDetectorRef);
  private translationService = inject(TranslationService);

  isLoading = signal(true);
  allProducts: IProduct[] = [];
  filtered: IProduct[] = [];

  searchTerm = '';
  selectedPriceRanges: PriceRange[] = [];
  selectedAvailability: string[] = [];
  selectedBrands: string[] = [];
  brandSearchTerm = '';
  showFilterDrawer = false;

  priceRanges: PriceRange[] = [
    { label: this.translationService.translate('filter.price_0_500'), min: 0, max: 500 },
    { label: this.translationService.translate('filter.price_500_1000'), min: 500, max: 1000 },
    { label: this.translationService.translate('filter.price_1000_1500'), min: 1000, max: 1500 },
    { label: this.translationService.translate('filter.price_1500_2000'), min: 1500, max: 2000 },
    { label: this.translationService.translate('filter.price_2000_2500'), min: 2000, max: 2500 },
    { label: this.translationService.translate('filter.price_2500_3000'), min: 2500, max: 3000 },
    { label: this.translationService.translate('filter.price_3000_3500'), min: 3000, max: 3500 },
  ];

  availabilityFilters = [
    { label: this.translationService.translate('filter.in_stock'), value: 'in-stock' },
    { label: this.translationService.translate('filter.out_of_stock'), value: 'out-of-stock' },
  ];

  ngOnInit(): void {
    this.fetch();
  }

  private fetch(): void {
    this.isLoading.set(true);
    this.wholesaleService.getAll().subscribe({
      next: (products) => {
        this.allProducts = products;
        this.applyFilters();
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.allProducts = [];
        this.filtered = [];
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  get brandList(): { name: string; count: number }[] {
    const map = new Map<string, number>();
    for (const p of this.allProducts) {
      if (!p.brand) continue;
      map.set(p.brand, (map.get(p.brand) || 0) + 1);
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }

  get filteredBrandList(): { name: string; count: number }[] {
    const term = this.brandSearchTerm.trim().toLowerCase();
    if (!term) return this.brandList;
    return this.brandList.filter(b => b.name.toLowerCase().includes(term));
  }

  get activeFilterCount(): number {
    return this.selectedPriceRanges.length
      + this.selectedAvailability.length
      + this.selectedBrands.length
      + (this.searchTerm.trim() ? 1 : 0);
  }

  applyFilters(): void {
    let result = [...this.allProducts];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      result = result.filter(p =>
        (p.titleAr || '').toLowerCase().includes(term) ||
        (p.title || '').toLowerCase().includes(term)
      );
    }

    if (this.selectedPriceRanges.length) {
      result = result.filter(p => {
        const price = p.wholesalePrice ?? p.price ?? 0;
        return this.selectedPriceRanges.some(r => price >= r.min && price < r.max);
      });
    }

    if (this.selectedAvailability.length) {
      result = result.filter(p => {
        const inStock = (p.stock ?? 0) > 0;
        return (inStock && this.selectedAvailability.includes('in-stock'))
          || (!inStock && this.selectedAvailability.includes('out-of-stock'));
      });
    }

    if (this.selectedBrands.length) {
      result = result.filter(p => p.brand && this.selectedBrands.includes(p.brand));
    }

    this.filtered = result;
    this.cdr.markForCheck();
  }

  togglePriceRange(range: PriceRange): void {
    const idx = this.selectedPriceRanges.indexOf(range);
    if (idx >= 0) this.selectedPriceRanges.splice(idx, 1);
    else this.selectedPriceRanges.push(range);
    this.applyFilters();
  }

  isPriceRangeSelected(range: PriceRange): boolean {
    return this.selectedPriceRanges.includes(range);
  }

  toggleAvailability(value: string): void {
    const idx = this.selectedAvailability.indexOf(value);
    if (idx >= 0) this.selectedAvailability.splice(idx, 1);
    else this.selectedAvailability.push(value);
    this.applyFilters();
  }

  toggleBrand(name: string): void {
    const idx = this.selectedBrands.indexOf(name);
    if (idx >= 0) this.selectedBrands.splice(idx, 1);
    else this.selectedBrands.push(name);
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedPriceRanges = [];
    this.selectedAvailability = [];
    this.selectedBrands = [];
    this.brandSearchTerm = '';
    this.applyFilters();
  }

  onAddToCart(product: IProduct): void {
    this.cartService.addToCart(product);
  }

  openFilterDrawer(): void {
    this.showFilterDrawer = true;
  }

  closeFilterDrawer(): void {
    this.showFilterDrawer = false;
  }
}
