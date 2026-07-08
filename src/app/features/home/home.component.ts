import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { CategoryService } from '../../core/services/category.service';
import { BrandService } from '../../core/services/brand.service';
import { BannerService } from '../../core/services/banner.service';
import { SiteSettingsService } from '../../core/services/settings.service';
import { SeoService } from '../../core/services/seo.service';
import { IProduct } from '../../core/models/product.model';
import { IBanner } from '../../core/models/banner.model';
import { ICategory } from '../../core/models/category.model';
import { IBrand } from '../../core/models/brand.model';
import { HeroSliderComponent } from './components/hero-slider/hero-slider.component';
import { FeaturedProductsComponent } from './components/featured-products/featured-products.component';
import { CategoriesGridComponent } from './components/categories-grid/categories-grid.component';
import { BrandsGridComponent } from './components/brands-grid/brands-grid.component';
import { NaturalProductsComponent, INaturalProductItem } from './components/natural-products/natural-products.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { CldImagePipe } from '../../shared/pipes/cld-image.pipe';

@Component({
  selector: 'app-home',
  imports: [HeroSliderComponent, FeaturedProductsComponent, CategoriesGridComponent, BrandsGridComponent, NaturalProductsComponent, SkeletonLoaderComponent, TranslatePipe, CldImagePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private bannerService = inject(BannerService);
  private settingsService = inject(SiteSettingsService);
  private seoService = inject(SeoService);

  bestSellingProducts: IProduct[] = [];
  categories: ICategory[] = [];
  brands: IBrand[] = [];
  naturalProducts: INaturalProductItem[] = [];
  homeBanners: IBanner[] = [];
  belowSliderBanners: IBanner[] = [];
  belowCategoriesBanners: IBanner[] = [];
  belowBestSellingBanners: IBanner[] = [];
  belowBrandsBanners: IBanner[] = [];
  isLoadingBanners = signal(true);
  isLoading = signal(true);
  isLoadingProducts = signal(true);
  isLoadingBrands = signal(true);

  private allBrands: IBrand[] = [];
  private brandTopIds: number[] = [];

  ngOnInit(): void {
    this.seoService.setPageMeta({
      title: 'الرئيسية',
      description: 'Check - متجرك الإلكتروني للتسوق أونلاين. اكتشف أفضل المنتجات بأفضل الأسعار مع شحن سريع لجميع محافظات مصر.',
      path: '/',
    });
    this.bannerService.getByPage('home').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(b => {
      this.homeBanners = b;
      this.isLoadingBanners.set(false);
      this.cdr.markForCheck();
    });
    this.bannerService.getByPage('home-below').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(b => {
      this.belowSliderBanners = b;
      this.cdr.markForCheck();
    });
    this.bannerService.getByPage('below-categories').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(b => {
      this.belowCategoriesBanners = b;
      this.cdr.markForCheck();
    });
    this.bannerService.getByPage('below-bestselling').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(b => {
      this.belowBestSellingBanners = b;
      this.cdr.markForCheck();
    });
    this.bannerService.getByPage('below-brands').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(b => {
      this.belowBrandsBanners = b;
      this.cdr.markForCheck();
    });
    this.categoryService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(c => {
      this.categories = c;
      this.isLoading.set(false);
      this.cdr.markForCheck();
    });

    this.brandService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(allBrands => {
      this.allBrands = allBrands;
      this.brands = this.brandTopIds.length > 0
        ? this.brandTopIds.map(id => allBrands.find(b => b.id === id)).filter((b): b is IBrand => !!b)
        : allBrands;
      this.isLoadingBrands.set(false);
      this.cdr.markForCheck();
    });

    this.settingsService.getSettings().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(settings => {
      this.brandTopIds = settings.bestSellingBrands || [];
      this.naturalProducts = (settings.naturalProducts || []).filter(i => i?.video);
      if (this.allBrands.length && this.brandTopIds.length) {
        this.brands = this.brandTopIds
          .map(id => this.allBrands.find(b => b.id === id))
          .filter((b): b is IBrand => !!b);
        this.cdr.markForCheck();
      }
    });

    this.settingsService.getHomeProducts().pipe(
      catchError(() => of([])),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(products => {
      this.bestSellingProducts = products.map(p => this.productService.mapServerProduct(p));
      this.isLoadingProducts.set(false);
      this.cdr.markForCheck();
    });
  }

  onAddToCart(product: IProduct): void {
    this.cartService.addToCart(product);
  }

  onAddToWishlist(product: IProduct): void {
    this.wishlistService.addToWishlist(product);
  }
}
