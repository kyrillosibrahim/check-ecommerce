import { ChangeDetectionStrategy, Component, inject, ChangeDetectorRef, OnInit, OnDestroy, HostListener, DestroyRef, signal, PLATFORM_ID } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AsyncPipe, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { NotificationsService } from '../../../core/services/notifications.service';
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
import { CldImagePipe } from '../../pipes/cld-image.pipe';
import { IBrand } from '../../../core/models/brand.model';
import { ICategory } from '../../../core/models/category.model';
import { IProduct } from '../../../core/models/product.model';
import { unitPriceAfterDiscount } from '../../../core/utils/pricing.util';

const RECENTLY_VIEWED_KEY = 'recently_viewed_products';

/** Delivery widths used for the mega-menu thumbnails, matched to their rendered size. */
const SUB_THUMB_WIDTH = 150;
const BRAND_THUMB_WIDTH = 160;
/** Upper bound on how many thumbnails the idle prefetch is allowed to warm. */
const PREFETCH_LIMIT = 120;
/** Bootstrap's `lg` breakpoint — below it the categories bar (and mega menu) is hidden. */
const MEGA_MENU_MIN_WIDTH = 992;

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, AsyncPipe, FormsModule, TranslatePipe, EgpCurrencyPipe, CldImagePipe],
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
  notificationsService = inject(NotificationsService);
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  translationService = inject(TranslationService);
  authDrawerService = inject(AuthDrawerService);
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);
  private readonly cldImage = new CldImagePipe();

  searchTerm = '';
  showSearchOverlay = false;
  showCartDropdown = false;
  showProfileDropdown = false;
  showMobileDrawer = false;
  activeNavIndex = 0;
  hideBottomNav = false;

  // Mega-menu hover state
  hoveredCategory: ICategory | null = null;
  private hoverTimeout: any;

  logoUrl = 'assets/logobluewithoutbg.png';
  logoLoaded = false;
  logoIconUrl = 'assets/logobluewithoutbg.png';
  logoIconLoaded = false;
  social = { facebook: '', instagram: '', whatsapp: '', phone: '' };
  recentlyViewed: IProduct[] = [];
  brands: IBrand[] = [];
  allBrands: IBrand[] = [];
  categories: ICategory[] = [];
  isLoadingCategories = signal(true);
  loaderSlots = [0, 1, 2];

  // Live search
  searchSuggestions: IProduct[] = [];
  brandSuggestions: IBrand[] = [];
  isSearching = false;
  private searchSubject = new Subject<string>();

  /** Unit price after discount — used by the cart dropdown. */
  unitPrice(product: IProduct): number {
    return unitPriceAfterDiscount(product);
  }

  ngOnInit(): void {
    this.updateActiveNav(this.router.url);
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(e => {
      this.updateActiveNav(e.urlAfterRedirects);
      this.cdr.markForCheck();
    });

    combineLatest([
      this.brandService.getAll(),
      this.settingsService.getSettings(),
    ]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(([allBrands, settings]) => {
      this.allBrands = allBrands;
      const lang = this.translationService.currentLang();

      const newLogoUrl = this.settingsService.getLogoUrlByLang(settings, lang);
      if (newLogoUrl !== this.logoUrl) {
        this.logoLoaded = false;
        this.logoUrl = newLogoUrl;
      }

      const newIconUrl = this.settingsService.getIconUrl(settings);
      if (newIconUrl !== this.logoIconUrl) {
        this.logoIconLoaded = false;
        this.logoIconUrl = newIconUrl;
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
    this.categoryService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(c => {
        this.categories = c;
        this.isLoadingCategories.set(false);
        this.cdr.markForCheck();
        this.prefetchMegaMenuImages(c);
      });

    // Live search: debounce input, call server
    this.searchSubject.pipe(
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
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      this.searchSuggestions = result.products;
      this.isSearching = false;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
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
    // Use the numeric id (short URL) instead of the Arabic slug (long when encoded)
    this.router.navigate(['/products'], { queryParams: { category: category.id } });
    this.closeSearchOverlay();
    this.hoveredCategory = null;
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

  /**
   * Warm the browser cache with the resized mega-menu thumbnails. The menu itself
   * lives behind `@if (hoveredCategory)`, so without this the images only start
   * downloading on the first hover. Runs on idle time so it never competes with
   * the initial render, and only on the breakpoint where the menu exists — the
   * categories bar is `d-none d-lg-block`, so on phones these would never be shown.
   */
  private prefetchMegaMenuImages(cats: ICategory[]): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!window.matchMedia(`(min-width: ${MEGA_MENU_MIN_WIDTH}px)`).matches) return;

    const urls = new Set<string>();
    for (const cat of cats) {
      for (const sub of cat.subcategories || []) {
        if (sub.image) urls.add(this.cldImage.transform(sub.image, SUB_THUMB_WIDTH));
      }
      for (const brand of cat.famousBrands || []) {
        if (brand.image) urls.add(this.cldImage.transform(brand.image, BRAND_THUMB_WIDTH));
      }
    }
    if (!urls.size) return;

    const warm = () => {
      for (const url of Array.from(urls).slice(0, PREFETCH_LIMIT)) {
        const img = new Image();
        img.decoding = 'async';
        img.setAttribute('fetchpriority', 'low');
        img.src = url;
      }
    };

    // requestIdleCallback is still missing from some lib.dom typings.
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
    if (idle) idle(warm); else setTimeout(warm, 1500);
  }

  /** Remove the shimmer placeholder once a mega-menu image has loaded. */
  onImgLoad(event: Event): void {
    (event.target as HTMLElement).classList.remove('is-loading');
  }

  /** Drop the shimmer and mark a broken image so it doesn't show a broken icon. */
  onImgError(event: Event): void {
    const el = event.target as HTMLElement;
    el.classList.remove('is-loading');
    el.classList.add('is-failed');
  }

  onMegaMenuLeave(): void {
    this.onCategoryLeave();
  }

  searchBySubcategory(cat: ICategory, subId: number): void {
    this.hoveredCategory = null;
    // Short URL: numeric category + subcategory ids instead of Arabic slugs
    this.router.navigate(['/products'], { queryParams: { category: cat.id, subcategory: subId } });
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

  // ── Mobile drawer ──
  openMobileDrawer(): void {
    this.showMobileDrawer = true;
    this.cdr.markForCheck();
  }

  closeMobileMenu(): void {
    this.showMobileDrawer = false;
    this.cdr.markForCheck();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  /** Bottom-nav items: home, offers, watch, cart, and (profile | login) = 5. */
  get navItemCount(): number {
    return 5;
  }

  get navIndicatorLeft(): string {
    if (this.activeNavIndex < 0) return '-100%';
    const count = this.navItemCount;
    const isRtl = this.translationService.currentLang() === 'ar';
    const idx = isRtl ? (count - 1 - this.activeNavIndex) : this.activeNavIndex;
    const w = 100 / count;
    return (idx * w + w / 2) + '%';
  }

  private updateActiveNav(url: string): void {
    this.hideBottomNav = false;
    const loggedIn = this.authService.isLoggedIn();
    if (url === '/' || url === '') this.activeNavIndex = 0;
    else if (url.startsWith('/offers')) this.activeNavIndex = 1;
    else if (url.startsWith('/watch')) this.activeNavIndex = 2;
    else if (url.startsWith('/cart')) this.activeNavIndex = 3;
    // Notifications moved to the top header bell — no bottom-nav slot anymore.
    else if (url.startsWith('/profile')) this.activeNavIndex = loggedIn ? 4 : -1;
    else this.activeNavIndex = -1;
  }
}
