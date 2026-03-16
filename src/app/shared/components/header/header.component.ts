import { ChangeDetectionStrategy, Component, inject, ChangeDetectorRef, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { TranslationService } from '../../../core/services/translation.service';
import { AuthDrawerService } from '../../../core/services/auth-drawer.service';
import { BrandService } from '../../../core/services/brand.service';
import { CategoryService } from '../../../core/services/category.service';
import { SiteSettingsService } from '../../../core/services/settings.service';
import { ProductService } from '../../../core/services/product.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { EgpCurrencyPipe } from '../../pipes/egp-currency.pipe';
import { IBrand } from '../../../core/models/brand.model';
import { ICategory } from '../../../core/models/category.model';
import { IProduct } from '../../../core/models/product.model';

const RECENTLY_VIEWED_KEY = 'recently_viewed_products';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, AsyncPipe, FormsModule, TranslatePipe, EgpCurrencyPipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private brandService = inject(BrandService);
  private categoryService = inject(CategoryService);
  private productService = inject(ProductService);
  private settingsService = inject(SiteSettingsService);
  cartService = inject(CartService);
  wishlistService = inject(WishlistService);
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  translationService = inject(TranslationService);
  authDrawerService = inject(AuthDrawerService);

  searchTerm = '';
  showSearchOverlay = false;
  showCartDropdown = false;
  showProfileDropdown = false;

  // Mega-menu hover state
  hoveredCategory: ICategory | null = null;
  private hoverTimeout: any;

  logoUrl = 'assets/logobluewithoutbg.png';
  logoLoaded = false;
  social = { facebook: '', instagram: '', whatsapp: '', phone: '' };
  recentlyViewed: IProduct[] = [];
  brands: IBrand[] = [];
  allBrands: IBrand[] = [];
  categories: ICategory[] = [];

  // Live search
  searchSuggestions: IProduct[] = [];
  brandSuggestions: IBrand[] = [];
  isSearching = false;
  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  ngOnInit(): void {
    this.brandService.getAll().subscribe(allBrands => {
      this.allBrands = allBrands;
      this.settingsService.getSettings().subscribe(settings => {
        if (settings.logo) {
          this.logoUrl = this.settingsService.getLogoUrl(settings.logo);
        }
        if (settings.social) {
          this.social = settings.social;
        }
        if (settings.bestSellingBrands?.length) {
          this.brands = settings.bestSellingBrands
            .map(id => allBrands.find(b => b.id === id))
            .filter((b): b is IBrand => !!b);
        } else {
          this.brands = allBrands;
        }
        this.cdr.markForCheck();
      });
    });
    this.categoryService.getAll().subscribe(c => {
      this.categories = c;
      this.cdr.markForCheck();
    });

    // Live search: debounce input, call server
    this.searchSub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term || term.length < 2) {
          this.searchSuggestions = [];
          this.brandSuggestions = [];
          this.isSearching = false;
          this.cdr.markForCheck();
          return [];
        }
        this.isSearching = true;
        this.cdr.markForCheck();
        // Filter brands client-side (small list)
        const lower = term.toLowerCase();
        this.brandSuggestions = this.allBrands.filter(b =>
          b.name.toLowerCase().includes(lower)
        ).slice(0, 5);
        // Search products from server
        return this.productService.searchProducts({ search: term, limit: 10 });
      })
    ).subscribe(result => {
      this.searchSuggestions = result.products;
      this.isSearching = false;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm.trim());
  }

  openSearchOverlay(): void {
    this.loadRecentlyViewed();
    this.showSearchOverlay = true;
    this.cdr.markForCheck();
  }

  closeSearchOverlay(): void {
    this.showSearchOverlay = false;
    this.cdr.markForCheck();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeSearchOverlay();
  }

  onSearch(): void {
    if (this.searchTerm.trim()) {
      this.router.navigate(['/products'], { queryParams: { search: this.searchTerm.trim() } });
      this.closeSearchOverlay();
    }
  }

  searchByCategory(category: ICategory): void {
    this.router.navigate(['/products'], { queryParams: { category: category.slug } });
    this.closeSearchOverlay();
  }

  searchByBrand(brand: IBrand): void {
    this.router.navigate(['/products'], { queryParams: { brand: brand.name } });
    this.closeSearchOverlay();
  }

  goToProduct(product: IProduct): void {
    this.router.navigate(['/product', product.id]);
    this.closeSearchOverlay();
  }

  private loadRecentlyViewed(): void {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
      if (ids.length === 0) {
        this.recentlyViewed = [];
        return;
      }
      this.productService.getByIds(ids.slice(0, 10)).subscribe(products => {
        this.recentlyViewed = products;
        this.cdr.markForCheck();
      });
    } catch {
      this.recentlyViewed = [];
    }
  }

  getProductImage(product: IProduct): string {
    return product.images?.[0] || product.swiperImages?.[0] || '';
  }

  // Drag-to-scroll for recently viewed
  private dragging = false;
  private startX = 0;
  private scrollLeft = 0;

  onDragStart(e: MouseEvent, el: HTMLElement): void {
    this.dragging = true;
    this.startX = e.pageX - el.offsetLeft;
    this.scrollLeft = el.scrollLeft;
  }

  onDragMove(e: MouseEvent, el: HTMLElement): void {
    if (!this.dragging) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    el.scrollLeft = this.scrollLeft - (x - this.startX);
  }

  onDragEnd(): void {
    this.dragging = false;
  }

  // ── Mega-menu hover ──
  onCategoryHover(cat: ICategory): void {
    clearTimeout(this.hoverTimeout);
    this.hoveredCategory = cat;
    this.cdr.markForCheck();
  }

  onCategoryLeave(): void {
    this.hoverTimeout = setTimeout(() => {
      this.hoveredCategory = null;
      this.cdr.markForCheck();
    }, 150);
  }

  onMegaMenuEnter(): void {
    clearTimeout(this.hoverTimeout);
  }

  onMegaMenuLeave(): void {
    this.onCategoryLeave();
  }

  searchBySubcategory(cat: ICategory, subSlug: string): void {
    this.hoveredCategory = null;
    this.router.navigate(['/products'], { queryParams: { category: cat.slug, subcategory: subSlug } });
  }

  searchByBrandFromMenu(brandName: string): void {
    this.hoveredCategory = null;
    this.router.navigate(['/products'], { queryParams: { brand: brandName } });
  }

  removeFromCartHover(productId: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.cartService.removeFromCart(productId);
  }

  // ── Mobile menu ──
  private elRef = inject(ElementRef);

  closeMobileMenu(): void {
    const navbarCollapse = this.elRef.nativeElement.querySelector('#navbarMain');
    if (navbarCollapse?.classList.contains('show')) {
      const bsCollapse = (window as any).bootstrap?.Collapse?.getInstance(navbarCollapse)
        || new (window as any).bootstrap.Collapse(navbarCollapse);
      bsCollapse.hide();
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
