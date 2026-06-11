import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit, signal, PLATFORM_ID, DestroyRef, SecurityContext } from '@angular/core';
import { isPlatformBrowser, AsyncPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, animationFrameScheduler } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { SeoService } from '../../core/services/seo.service';
import { SiteSettingsService } from '../../core/services/settings.service';
import { ReviewService } from '../../core/services/review.service';
import { AlertService } from '../../core/services/alert.service';
import { IProduct } from '../../core/models/product.model';
import { IReview } from '../../core/models/review.model';
import { ImageGalleryComponent } from './components/image-gallery/image-gallery.component';
import { RelatedProductsComponent } from './components/related-products/related-products.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { DiscountPricePipe } from '../../shared/pipes/discount-price.pipe';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LocalizePipe } from '../../shared/pipes/localize.pipe';
import { EgpCurrencyPipe } from '../../shared/pipes/egp-currency.pipe';
import { CldImagePipe } from '../../shared/pipes/cld-image.pipe';
import { TranslationService } from '../../core/services/translation.service';
import { TestimonialsMarqueeComponent } from '../../shared/components/testimonials-marquee/testimonials-marquee.component';
import { TextLoopComponent } from '../../shared/components/text-loop/text-loop.component';
import { ShippingEstimatorComponent } from '../../shared/components/shipping-estimator/shipping-estimator.component';
import { TrustPanelComponent } from '../../shared/components/trust-panel/trust-panel.component';
import { DirectOrderModalComponent } from './direct-order-modal/direct-order-modal.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product-details',
  imports: [AsyncPipe, DatePipe, FormsModule, EgpCurrencyPipe, CldImagePipe, RouterLink, ImageGalleryComponent, RelatedProductsComponent, SkeletonLoaderComponent, DiscountPricePipe, TranslatePipe, LocalizePipe, TestimonialsMarqueeComponent, TextLoopComponent, ShippingEstimatorComponent, TrustPanelComponent, DirectOrderModalComponent],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  translationService = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private sanitizer = inject(DomSanitizer);
  cartService = inject(CartService);
  authService = inject(AuthService);
  private wishlistService = inject(WishlistService);
  private reviewService = inject(ReviewService);
  private alertService = inject(AlertService);

  private seoService = inject(SeoService);
  private settingsService = inject(SiteSettingsService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private destroyRef = inject(DestroyRef);

  ourLogoUrl = 'assets/logobluewithoutbg.png';
  product: IProduct | undefined;
  /** Product merged with the active variant's images/prices/stock. Equals `product` when no variant is selected. */
  displayProduct: IProduct | undefined;
  selectedVariantId: string | null = null;
  relatedProducts: IProduct[] = [];
  quantity = 1;
  isLoading = signal(true);
  descriptionHtml: SafeHtml = '';
  showStickyBar = signal(false);
  naturalExpanded = signal(false);
  lightboxIndex = signal<number | null>(null);

  readonly starsArray = [1, 2, 3, 4, 5];

  // ── Reviews ──
  reviews = signal<IReview[]>([]);
  myReview = signal<IReview | null>(null);
  reviewSubmitted = signal(false);
  selectedStars = signal(0);
  hoverStars = signal(0);
  reviewComment = '';
  isSubmittingReview = signal(false);

  get approvedReviewsCount(): number {
    return this.reviews().length;
  }

  get averageRating(): number {
    const list = this.reviews();
    if (!list.length) return 0;
    const sum = list.reduce((acc, r) => acc + (r.rating || 0), 0);
    return Math.round((sum / list.length) * 10) / 10;
  }

  /** A distinct color per star level (5=green … 1=red). */
  private readonly starColors: Record<number, string> = {
    5: '#4caf50',
    4: '#8bc34a',
    3: '#ffc107',
    2: '#ff9800',
    1: '#f44336',
  };

  /** Distribution of ratings from 5 down to 1 with percentages and colors. */
  get ratingDistribution(): { star: number; count: number; percent: number; color: string }[] {
    const list = this.reviews();
    const total = list.length;
    return [5, 4, 3, 2, 1].map(star => {
      const count = list.filter(r => Math.round(r.rating) === star).length;
      return {
        star,
        count,
        percent: total ? Math.round((count / total) * 100) : 0,
        color: this.starColors[star],
      };
    });
  }

  // ── read-more state ──
  expandedReviews = signal<Set<string>>(new Set());

  isExpanded(id: string): boolean {
    return this.expandedReviews().has(id);
  }

  isLongComment(comment: string): boolean {
    return (comment || '').length > 160;
  }

  toggleExpand(id: string): void {
    const next = new Set(this.expandedReviews());
    if (next.has(id)) { next.delete(id); } else { next.add(id); }
    this.expandedReviews.set(next);
  }

  initial(name: string): string {
    return (name || '؟').trim().charAt(0).toUpperCase();
  }

  markReviewHelpful(review: IReview): void {
    if (!this.authService.isLoggedIn()) {
      this.alertService.toast({ icon: 'info', title: this.translationService.translate('reviews.login_to_vote') });
      return;
    }
    this.reviewService.markHelpful(review.id).subscribe({
      next: res => {
        this.reviews.set(this.reviews().map(r =>
          r.id === review.id ? { ...r, helpfulCount: res.helpfulCount, helpfulByMe: res.helpfulByMe } : r
        ));
        this.cdr.markForCheck();
      },
    });
  }

  /** The user already has a review (or just submitted one) → hide the write form. */
  get hasReviewed(): boolean {
    return this.reviewSubmitted() || !!this.myReview();
  }

  /** Show the "under review" message vs the "already published" message. */
  get isReviewPending(): boolean {
    return this.reviewSubmitted() || this.myReview()?.status !== 'approved';
  }

  private loadReviews(productId: string): void {
    this.reviewService.getProductReviews(productId).subscribe(list => {
      this.reviews.set(list || []);
      this.cdr.markForCheck();
    });
    if (this.authService.isLoggedIn()) {
      this.reviewService.getMyReview(productId).subscribe(mine => {
        this.myReview.set(mine);
        if (mine) {
          this.selectedStars.set(mine.rating);
          this.reviewComment = mine.comment;
        }
        this.cdr.markForCheck();
      });
    }
  }

  setStars(n: number): void {
    this.selectedStars.set(n);
  }

  submitReview(): void {
    if (!this.product) return;
    const rating = this.selectedStars();
    if (rating < 1) {
      this.alertService.toast({ icon: 'warning', title: this.translationService.translate('reviews.choose_stars') });
      return;
    }
    this.isSubmittingReview.set(true);
    this.reviewService.submitReview({
      productId: this.product.id,
      rating,
      comment: this.reviewComment.trim(),
    }).subscribe({
      next: res => {
        this.myReview.set(res.review);
        this.reviewSubmitted.set(true);
        this.isSubmittingReview.set(false);
        this.alertService.toast({ icon: 'success', title: this.translationService.translate('reviews.pending_msg') });
        this.cdr.markForCheck();
      },
      error: err => {
        this.isSubmittingReview.set(false);
        this.alertService.fire({
          icon: 'error',
          title: this.translationService.translate('reviews.error'),
          text: err?.error?.error || '',
        });
        this.cdr.markForCheck();
      },
    });
  }

  get hasDiscount(): boolean {
    return !!this.displayProduct && this.displayProduct.discountPercentage > 0;
  }

  getOurPrice(): number {
    if (!this.displayProduct) return 0;
    return this.displayProduct.discountedPrice ||
      (this.displayProduct.price * (1 - (this.displayProduct.discountPercentage || 0) / 100));
  }

  getPriceDiffPercent(sitePrice: number): number {
    const ourPrice = this.getOurPrice();
    if (!ourPrice) return 0;
    return Math.round(((sitePrice - ourPrice) / ourPrice) * 100);
  }

  get naturalImages(): string[] {
    return this.displayProduct?.naturalImages ?? [];
  }

  get hasVariants(): boolean {
    return !!this.product?.hasVariants && !!this.product.variants?.length;
  }

  /** List of selectable variant chips. The first chip represents the base product. */
  get variantChips(): { id: string | null; label: string; ar?: string; colorHex?: string }[] {
    if (!this.product || !this.hasVariants) return [];
    const baseLabel = this.product.baseVariantNameAr || this.product.titleAr || this.product.title;
    const chips: { id: string | null; label: string; ar?: string; colorHex?: string }[] = [
      { id: null, label: baseLabel, ar: this.product.baseVariantNameAr, colorHex: this.product.baseColorHex }
    ];
    for (const v of this.product.variants!) {
      chips.push({ id: v.id, label: v.nameAr || v.name, ar: v.nameAr, colorHex: v.colorHex });
    }
    return chips;
  }

  get isColorMode(): boolean {
    return this.product?.variantOptionType === 'color';
  }

  selectVariant(id: string | null): void {
    this.selectedVariantId = id;
    this.displayProduct = this.computeDisplayProduct();
    this.quantity = 1;
    this.cdr.markForCheck();
  }

  private computeDisplayProduct(): IProduct | undefined {
    if (!this.product) return undefined;
    const id = this.selectedVariantId;
    if (!id) return this.product;
    const v = this.product.variants?.find(x => x.id === id);
    if (!v) return this.product;

    const originalPrice = v.originalPrice ?? this.product.price;
    const discountedPrice = v.discountedPrice ?? originalPrice;
    const discountPercentage = originalPrice > 0 && discountedPrice < originalPrice
      ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100 * 100) / 100
      : 0;

    return {
      ...this.product,
      images: v.mainImages?.length ? v.mainImages : this.product.images,
      naturalImages: v.naturalImages?.length ? v.naturalImages : this.product.naturalImages,
      price: originalPrice,
      discountPercentage,
      wholesalePrice: v.wholesalePrice ?? this.product.wholesalePrice,
      originalPrice: v.originalPrice ?? this.product.originalPrice,
      discountedPrice: v.discountedPrice ?? this.product.discountedPrice,
      stock: v.stock ?? this.product.stock,
    };
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      document.body.classList.add('product-details-active');
      fromEvent(window, 'scroll', { passive: true })
        .pipe(
          throttleTime(120, animationFrameScheduler, { leading: true, trailing: true }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => {
          const shouldShow = window.scrollY > 600;
          if (shouldShow !== this.showStickyBar()) {
            this.showStickyBar.set(shouldShow);
          }
        });
    }
    this.settingsService.getSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(settings => {
        this.ourLogoUrl = this.settingsService.getLogoUrl(settings.logo) || this.ourLogoUrl;
        this.cdr.markForCheck();
      });
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.isLoading.set(true);
      this.quantity = 1;
      // reset review state for the new product
      this.reviews.set([]);
      this.myReview.set(null);
      this.reviewSubmitted.set(false);
      this.selectedStars.set(0);
      this.hoverStars.set(0);
      this.reviewComment = '';
      this.expandedReviews.set(new Set());
      if (this.isBrowser) window.scrollTo({ top: 0, behavior: 'instant' });
      this.productService.getOneProduct(params['id'])
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(result => {
        if (result) {
          this.product = result.product;
          this.selectedVariantId = null;
          this.displayProduct = result.product;
          this.relatedProducts = result.relatedProducts;
          this.trackRecentlyViewed(result.product.id);
          this.buildDescriptionHtml(result.product);
          this.seoService.setProductMeta(result.product);
          this.seoService.setProductJsonLd(result.product);
          this.loadReviews(result.product.id);
        } else {
          this.product = undefined;
          this.displayProduct = undefined;
          this.relatedProducts = [];
          this.descriptionHtml = '';
        }
        this.isLoading.set(false);
        this.cdr.markForCheck();
      });
    });
  }

  ngOnDestroy(): void {
    if (this.isBrowser) document.body.classList.remove('product-details-active');
  }

  incrementQty(): void {
    if (this.displayProduct && this.quantity < this.displayProduct.stock) {
      this.quantity++;
    }
  }

  decrementQty(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (this.displayProduct) {
      this.cartService.addToCart(this.displayProduct, this.quantity);
      this.displayProduct = { ...this.displayProduct, inCart: true };
      if (this.product) this.product = { ...this.product, inCart: true };
    }
  }

  get isInWishlist(): boolean {
    return !!this.product && (this.product.inFavorite || this.wishlistService.isInWishlist(this.product.id));
  }

  toggleWishlist(): void {
    if (this.product) {
      if (this.isInWishlist) {
        this.wishlistService.removeFromWishlist(this.product.id);
        this.product = { ...this.product, inFavorite: false };
      } else {
        this.wishlistService.addToWishlist(this.product);
        this.product = { ...this.product, inFavorite: true };
      }
    }
  }

  onRelatedAddToCart(product: IProduct): void {
    this.cartService.addToCart(product);
  }

  onRelatedAddToWishlist(product: IProduct): void {
    this.wishlistService.addToWishlist(product);
  }

  showDeliveryQuality(): void {
    const isAr = this.translationService.currentLang() === 'ar';
    Swal.fire({
      title: isAr ? 'كيف يتم تغليف المنتجات؟' : 'How are products packaged?',
      html: `
        <p style="color: var(--sz-text-secondary); font-size: 0.95rem; line-height: 1.8; margin-bottom: 1.5rem;">
          ${isAr
            ? 'تتم عملية تغليف وحماية المنتجات بواسطة فريق مُدرب محترف ليقدم عملية تغليف فائقة الجودة، باستخدام أفضل أدوات ومستلزمات التغليف مثل لفائف فقاعات الهواء (Bubbles Wrap)، وبكرات السلوفان (Stretch Wrap)، بالإضافة إلى ورق الكارتون المُقوّى.'
            : 'Products are packaged and protected by a professionally trained team to deliver premium quality packaging, using the best tools and supplies such as Bubble Wrap, Stretch Wrap, and reinforced cardboard.'}
        </p>
        <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
          <img src="assets/security/rapeer.png" alt="Stretch Wrap" style="width: 50%; border-radius: 10px; object-fit: cover;" />
          <img src="assets/security/carton.png" alt="Bubble Wrap" style="width: 50%; border-radius: 10px; object-fit: cover;" />
        </div>
        <p style="color: var(--sz-text-secondary); font-size: 0.9rem; line-height: 1.8;">
          ${isAr
            ? 'حيث يتم تغليف كل منتج على حدا بطبقات متعددة بلفائف البابلز قبل وضعها في الكرتون المخصص للشحن، ليصلك الطلب بأفضل حالة.'
            : 'Each product is individually wrapped in multiple layers of bubble wrap before being placed in the shipping carton, so your order arrives in perfect condition.'}
        </p>
      `,
      showCloseButton: true,
      showConfirmButton: false,
      width: '650px',
      customClass: {
        popup: 'delivery-quality-popup'
      }
    });
  }

  private buildDescriptionHtml(product: IProduct): void {
    let html = this.translationService.isArabic()
      ? (product.descriptionHtmlAr || product.descriptionHtml || '')
      : (product.descriptionHtml || product.descriptionHtmlAr || '');
    html = html.replace(/&nbsp;/g, ' ');
    this.descriptionHtml = html ? (this.sanitizer.sanitize(SecurityContext.HTML, html) ?? '') : '';
  }

  private trackRecentlyViewed(productId: string): void {
    if (!this.isBrowser) return;
    try {
      const key = 'recently_viewed_products';
      let ids: string[] = JSON.parse(localStorage.getItem(key) || '[]');
      ids = ids.filter(id => id !== productId);
      ids.unshift(productId);
      if (ids.length > 20) ids = ids.slice(0, 20);
      localStorage.setItem(key, JSON.stringify(ids));
    } catch { /* ignore */ }
  }

  truncate(text: string, max = 40): string {
    return text.length > max ? text.slice(0, max) + '...' : text;
  }

  openLightbox(index: number): void {
    this.lightboxIndex.set(index);
    if (this.isBrowser) document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightboxIndex.set(null);
    if (this.isBrowser) document.body.style.overflow = '';
  }

  prevLightbox(): void {
    const i = this.lightboxIndex();
    if (i === null) return;
    const len = this.naturalImages.length;
    this.lightboxIndex.set((i - 1 + len) % len);
  }

  nextLightbox(): void {
    const i = this.lightboxIndex();
    if (i === null) return;
    const len = this.naturalImages.length;
    this.lightboxIndex.set((i + 1) % len);
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
