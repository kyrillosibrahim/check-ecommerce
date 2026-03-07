import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { CategoryService } from '../../core/services/category.service';
import { BrandService } from '../../core/services/brand.service';
import { SiteSettingsService } from '../../core/services/settings.service';
import { IProduct } from '../../core/models/product.model';
import { ICategory } from '../../core/models/category.model';
import { IBrand } from '../../core/models/brand.model';
import { HeroSliderComponent } from './components/hero-slider/hero-slider.component';
import { FeaturedProductsComponent } from './components/featured-products/featured-products.component';
import { CategoriesGridComponent } from './components/categories-grid/categories-grid.component';
import { BrandsGridComponent } from './components/brands-grid/brands-grid.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-home',
  imports: [HeroSliderComponent, FeaturedProductsComponent, CategoriesGridComponent, BrandsGridComponent, SkeletonLoaderComponent, TranslatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private settingsService = inject(SiteSettingsService);

  bestSellingProducts: IProduct[] = [];
  categories: ICategory[] = [];
  brands: IBrand[] = [];
  isLoading = signal(true);

  ngOnInit(): void {
    this.categoryService.getAll().subscribe(c => {
      this.categories = c;
      this.isLoading.set(false);
      this.cdr.markForCheck();
    });
    this.brandService.getAll().subscribe(b => {
      this.brands = b;
      this.cdr.markForCheck();
    });
    this.settingsService.getSettings().subscribe(settings => {
      if (settings.bestSellingProducts?.length) {
        this.bestSellingProducts = settings.bestSellingProducts.map(
          (p: any) => this.productService.mapServerProduct(p)
        );
        this.cdr.markForCheck();
      }
    });
  }

  onAddToCart(product: IProduct): void {
    this.cartService.addToCart(product);
  }

  onAddToWishlist(product: IProduct): void {
    this.wishlistService.addToWishlist(product);
  }
}
