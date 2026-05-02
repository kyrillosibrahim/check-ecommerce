import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal, PLATFORM_ID, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { SeoService } from '../../core/services/seo.service';
import { IProduct } from '../../core/models/product.model';
import { ImageGalleryComponent } from './components/image-gallery/image-gallery.component';
import { RelatedProductsComponent } from './components/related-products/related-products.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { CarouselModule } from 'primeng/carousel';
import { DiscountPricePipe } from '../../shared/pipes/discount-price.pipe';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LocalizePipe } from '../../shared/pipes/localize.pipe';
import { EgpCurrencyPipe } from '../../shared/pipes/egp-currency.pipe';
import { TranslationService } from '../../core/services/translation.service';
import { TestimonialsMarqueeComponent } from '../../shared/components/testimonials-marquee/testimonials-marquee.component';
import { TextLoopComponent } from '../../shared/components/text-loop/text-loop.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product-details',
  imports: [EgpCurrencyPipe, RouterLink, ImageGalleryComponent, RelatedProductsComponent, SkeletonLoaderComponent, CarouselModule, DiscountPricePipe, TranslatePipe, LocalizePipe, TestimonialsMarqueeComponent, TextLoopComponent],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailsComponent implements OnInit {
  translationService = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private sanitizer = inject(DomSanitizer);
  cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private seoService = inject(SeoService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  product: IProduct | undefined;
  /** Product merged with the active variant's images/prices/stock. Equals `product` when no variant is selected. */
  displayProduct: IProduct | undefined;
  selectedVariantId: string | null = null;
  relatedProducts: IProduct[] = [];
  quantity = 1;
  isLoading = signal(true);
  descriptionHtml: SafeHtml = '';
  showStickyBar = signal(false);

  readonly starsArray = [1, 2, 3, 4, 5];

  get hasDiscount(): boolean {
    return !!this.displayProduct && this.displayProduct.discountPercentage > 0;
  }

  get naturalImages(): string[] {
    return this.displayProduct?.naturalImages ?? [];
  }

  get hasVariants(): boolean {
    return !!this.product?.hasVariants && !!this.product.variants?.length;
  }

  /** List of selectable variant chips. The first chip represents the base product. */
  get variantChips(): { id: string | null; label: string; ar?: string }[] {
    if (!this.product || !this.hasVariants) return [];
    const baseLabel = this.product.baseVariantNameAr || this.product.titleAr || this.product.title;
    const chips: { id: string | null; label: string; ar?: string }[] = [
      { id: null, label: baseLabel, ar: this.product.baseVariantNameAr }
    ];
    for (const v of this.product.variants!) {
      chips.push({ id: v.id, label: v.nameAr || v.name, ar: v.nameAr });
    }
    return chips;
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
    this.route.params.subscribe(params => {
      this.isLoading.set(true);
      this.quantity = 1;
      this.productService.getOneProduct(params['id']).subscribe(result => {
        if (result) {
          this.product = result.product;
          this.selectedVariantId = null;
          this.displayProduct = result.product;
          this.relatedProducts = result.relatedProducts;
          this.trackRecentlyViewed(result.product.id);
          this.buildDescriptionHtml(result.product);
          this.seoService.setProductMeta(result.product);
          this.seoService.setProductJsonLd(result.product);
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

  @HostListener('window:scroll')
  onScroll(): void {
    if (!this.isBrowser) return;
    const shouldShow = window.scrollY > 600;
    if (shouldShow !== this.showStickyBar()) {
      this.showStickyBar.set(shouldShow);
    }
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
    this.descriptionHtml = html ? this.sanitizer.bypassSecurityTrustHtml(html) : '';
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
