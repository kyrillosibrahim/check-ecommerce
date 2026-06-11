import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, Output, EventEmitter, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { IProduct } from '../../../core/models/product.model';
import { TranslationService } from '../../../core/services/translation.service';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { QuickViewService } from '../../../core/services/quick-view.service';
import { DiscountPricePipe } from '../../pipes/discount-price.pipe';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LocalizePipe } from '../../pipes/localize.pipe';
import { EgpCurrencyPipe } from '../../pipes/egp-currency.pipe';
import { CldImagePipe } from '../../pipes/cld-image.pipe';
import { TextLoopComponent } from '../text-loop/text-loop.component';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, EgpCurrencyPipe, DiscountPricePipe, TranslatePipe, LocalizePipe, TextLoopComponent, CldImagePipe],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent implements OnInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private imagesPreloaded = false;
  translationService = inject(TranslationService);
  cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private quickViewService = inject(QuickViewService);
  private alertService = inject(AlertService);
  @Input({ required: true }) product!: IProduct;
  @Input() priceMode: 'retail' | 'wholesale' = 'retail';
  @Output() addToCart = new EventEmitter<IProduct>();
  @Output() addToWishlist = new EventEmitter<IProduct>();

  private addedToCartLocal = false;
  currentImageIdx = 0;

  get isWholesale(): boolean {
    return this.priceMode === 'wholesale';
  }

  /** Main images array used by the swiper. */
  get swiperImages(): string[] {
    return this.product.images || [];
  }

  /** True when the card has more than one main image (controls arrow visibility). */
  get hasMultipleImages(): boolean {
    return this.swiperImages.length > 1;
  }

  /** What to display in the card image slot. */
  get displayImage(): string {
    const imgs = this.swiperImages;
    if (!imgs.length) return '';
    return imgs[this.currentImageIdx % imgs.length];
  }

  ngOnInit(): void {
    this.preloadImages();
  }

  private preloadImages(): void {
    if (this.imagesPreloaded) return;
    if (!isPlatformBrowser(this.platformId)) return;
    const imgs = this.swiperImages;
    if (imgs.length < 2) return;
    this.imagesPreloaded = true;
    for (let i = 1; i < imgs.length; i++) {
      const img = new Image();
      img.decoding = 'async';
      img.src = imgs[i];
    }
  }

  prevImage(event: Event): void {
    event.stopPropagation();
    const len = this.swiperImages.length;
    if (len < 2) return;
    this.preloadImages();
    this.currentImageIdx = (this.currentImageIdx - 1 + len) % len;
    this.cdr.markForCheck();
  }

  nextImage(event: Event): void {
    event.stopPropagation();
    const len = this.swiperImages.length;
    if (len < 2) return;
    this.preloadImages();
    this.currentImageIdx = (this.currentImageIdx + 1) % len;
    this.cdr.markForCheck();
  }

  get isInCart(): boolean {
    return this.addedToCartLocal || this.product.inCart || this.cartService.isInCart(this.product.id);
  }

  get isInWishlist(): boolean {
    return this.product.inFavorite || this.wishlistService.isInWishlist(this.product.id);
  }

  get isWishlistProcessing(): boolean {
    return this.wishlistService.isProcessing(this.product.id);
  }

  toggleWishlist(event: Event): void {
    event.stopPropagation();
    if (this.isWishlistProcessing) return;
    if (this.isInWishlist) {
      this.wishlistService.removeFromWishlist(this.product.id);
    } else {
      this.wishlistService.addToWishlist(this.product);
    }
  }

  get categoryName(): string {
    return (this.product.category || '').replaceAll('-', ' ');
  }

  get hasDiscount(): boolean {
    return this.product.discountPercentage > 0;
  }

  get hasMoreVariantOptions(): boolean {
    return !!this.product.hasVariants && (this.product.variants?.length ?? 0) > 1;
  }

  get moreOptionsText(): string {
    const isAr = this.translationService.currentLang() === 'ar';
    const type = this.product.variantOptionType;
    const arMap: Record<string, string> = {
      size: 'مقاس',
      type: 'نوع',
      volume: 'حجم',
      color: 'لون',
      model: 'موديل',
    };
    const enMap: Record<string, string> = {
      size: 'size',
      type: 'type',
      volume: 'volume',
      color: 'color',
      model: 'model',
    };
    if (isAr) {
      let label = this.product.variantOptionTypeAr || (type ? arMap[type] : 'الخيارات');
      // Strip leading "ال" then merge with prefix lam to avoid 3 lams (e.g. لل + لون → للون not لللون)
      if (label.startsWith('ال')) label = label.substring(2);
      const prefixed = label.startsWith('ل') ? `لل${label.substring(1)}` : `لل${label}`;
      return `يوجد خيارات أكثر بداخل ${prefixed}`;
    }
    const label = type ? enMap[type] : 'options';
    return `More ${label} options available inside the product`;
  }

  get wholesaleDiscountPct(): number {
    const orig = this.product.originalPrice ?? 0;
    const curr = this.product.price ?? 0;
    if (!orig || orig <= curr) return 0;
    return Math.round((orig - curr) / orig * 100);
  }

  readonly starsArray = [1, 2, 3, 4, 5];

  /**
   * Card body click. Retail cards navigate through the real <a class="stretched-link">
   * (so Ctrl/middle-click open a new tab); only wholesale cards — which have no detail
   * page — fall back to opening the quick-view here.
   */
  onCardClick(): void {
    if (this.isWholesale) this.quickViewService.open(this.product);
  }

  navigateToProduct(): void {
    if (this.isWholesale) {
      // Wholesale offers don't have a public detail page — open the quick-view instead.
      this.quickViewService.open(this.product);
      return;
    }
    this.router.navigate(['/product', this.product.id]);
  }

  openQuickView(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.quickViewService.open(this.product);
  }

  onAddToCart(): void {
    this.addedToCartLocal = true;
    this.addToCart.emit(this.product);
  }

  onComingSoon(): void {
    const isAr = this.translationService.currentLang() === 'ar';
    this.alertService.fire({
      title: isAr ? 'قريبًا !' : 'Coming Soon!',
      text: isAr
        ? 'المنتج على وشك الوصول الى مخازننا ... كن مستعدًا للحصول عليه!'
        : 'This product is arriving soon... Stay tuned!',
      icon: 'info',
      confirmButtonText: isAr ? 'حسنًا' : 'OK',
    });
  }
}
