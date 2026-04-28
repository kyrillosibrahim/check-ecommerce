import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, Output, EventEmitter, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IProduct } from '../../../core/models/product.model';
import { TranslationService } from '../../../core/services/translation.service';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { QuickViewService } from '../../../core/services/quick-view.service';
import { DiscountPricePipe } from '../../pipes/discount-price.pipe';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LocalizePipe } from '../../pipes/localize.pipe';
import { EgpCurrencyPipe } from '../../pipes/egp-currency.pipe';
import { TextLoopComponent } from '../text-loop/text-loop.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product-card',
  imports: [EgpCurrencyPipe, DiscountPricePipe, TranslatePipe, LocalizePipe, TextLoopComponent],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent implements OnDestroy {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  translationService = inject(TranslationService);
  cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private quickViewService = inject(QuickViewService);
  @Input({ required: true }) product!: IProduct;
  @Input() priceMode: 'retail' | 'wholesale' = 'retail';
  @Output() addToCart = new EventEmitter<IProduct>();
  @Output() addToWishlist = new EventEmitter<IProduct>();

  private addedToCartLocal = false;
  currentImageIdx = 0;
  private rotateInterval?: ReturnType<typeof setInterval>;

  get isWholesale(): boolean {
    return this.priceMode === 'wholesale';
  }

  /** Picks which image array drives the slideshow on hover. */
  private get slideshowImages(): string[] {
    return this.product.naturalImages?.length
      ? this.product.naturalImages
      : this.product.images || [];
  }

  /** What to display in the card image slot. */
  get displayImage(): string {
    const imgs = this.slideshowImages;
    if (this.isWholesale && imgs.length) {
      return imgs[this.currentImageIdx % imgs.length];
    }
    return this.product.images?.[0] || '';
  }

  onMouseEnter(): void {
    if (!this.isWholesale) return;
    const imgs = this.slideshowImages;
    if (imgs.length < 2) return;
    if (this.rotateInterval) return;
    this.rotateInterval = setInterval(() => {
      this.currentImageIdx = (this.currentImageIdx + 1) % imgs.length;
      this.cdr.markForCheck();
    }, 2000);
  }

  onMouseLeave(): void {
    if (this.rotateInterval) {
      clearInterval(this.rotateInterval);
      this.rotateInterval = undefined;
    }
    this.currentImageIdx = 0;
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    if (this.rotateInterval) clearInterval(this.rotateInterval);
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

  readonly starsArray = [1, 2, 3, 4, 5];

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
    Swal.fire({
      title: isAr ? 'قريبًا !' : 'Coming Soon!',
      text: isAr
        ? 'المنتج على وشك الوصول الى مخازننا ... كن مستعدًا للحصول عليه!'
        : 'This product is arriving soon... Stay tuned!',
      icon: 'info',
      confirmButtonText: isAr ? 'حسنًا' : 'OK',
    });
  }
}
