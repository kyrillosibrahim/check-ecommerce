import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { BannerService } from '../../core/services/banner.service';
import { TranslationService } from '../../core/services/translation.service';
import { IProduct } from '../../core/models/product.model';
import { IBanner } from '../../core/models/banner.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { LightRaysComponent } from './light-rays.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [RouterLink, FormsModule, ProductCardComponent, LightRaysComponent, TranslatePipe],
  templateUrl: './offers.component.html',
  styleUrl: './offers.component.scss',
})
export class OffersComponent implements OnInit {
  translationService = inject(TranslationService);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private bannerService = inject(BannerService);

  banners = signal<IBanner[]>([]);
  discountedProducts = signal<IProduct[]>([]);
  isLoading = signal(true);
  selectedCategory = signal('');
  sortBy = signal('default');

  availableCategories = computed(() => {
    const seen = new Set<string>();
    return this.discountedProducts()
      .map((p) => p.category)
      .filter((cat) => {
        if (!cat || seen.has(cat)) return false;
        seen.add(cat);
        return true;
      });
  });

  filteredProducts = computed(() => {
    let result = this.discountedProducts();

    const cat = this.selectedCategory();
    if (cat) {
      result = result.filter((p) => p.category === cat);
    }

    const sort = this.sortBy();
    switch (sort) {
      case 'discount-high':
        result = [...result].sort((a, b) => b.discountPercentage - a.discountPercentage);
        break;
      case 'discount-low':
        result = [...result].sort((a, b) => a.discountPercentage - b.discountPercentage);
        break;
      case 'price-low':
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result = [...result].sort((a, b) => b.price - a.price);
        break;
    }

    return result;
  });

  ngOnInit(): void {
    this.bannerService.getAll().subscribe(b => this.banners.set(b));

    this.productService.getAll().subscribe((products) => {
      if (products.length > 0) {
        this.discountedProducts.set(products.filter((p) => p.discountPercentage > 0));
        this.isLoading.set(false);
      }
    });
  }

  onCategorySelect(category: string): void {
    this.selectedCategory.set(category);
  }

  onSortChange(value: string): void {
    this.sortBy.set(value);
  }

  onAddToCart(product: IProduct): void {
    this.cartService.addToCart(product);
  }

  onAddToWishlist(product: IProduct): void {
    this.wishlistService.addToWishlist(product);
  }
}
