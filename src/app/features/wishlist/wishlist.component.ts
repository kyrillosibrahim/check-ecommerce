import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../../core/services/wishlist.service';
import { CartService } from '../../core/services/cart.service';
import { IProduct } from '../../core/models/product.model';
import { DiscountPricePipe } from '../../shared/pipes/discount-price.pipe';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LocalizePipe } from '../../shared/pipes/localize.pipe';
import { TranslationService } from '../../core/services/translation.service';
import { EgpCurrencyPipe } from '../../shared/pipes/egp-currency.pipe';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

const ITEMS_PER_PAGE = 36;

@Component({
  selector: 'app-wishlist',
  imports: [RouterLink, EgpCurrencyPipe, DiscountPricePipe, TranslatePipe, LocalizePipe, SkeletonLoaderComponent, PaginationComponent],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishlistComponent implements OnInit {
  translationService = inject(TranslationService);
  wishlistService = inject(WishlistService);
  private cartService = inject(CartService);
  private cdr = inject(ChangeDetectorRef);

  products: IProduct[] = [];
  currentPage = 1;
  totalPages = 1;
  totalProducts = 0;

  ngOnInit(): void {
    this.fetchPage();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.fetchPage();
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  moveToCart(productId: string): void {
    this.wishlistService.moveToCart(productId);
    this.products = this.products.filter(p => p.id !== productId);
    this.totalProducts = Math.max(0, this.totalProducts - 1);
    this.totalPages = Math.max(1, Math.ceil(this.totalProducts / ITEMS_PER_PAGE));
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    if (this.products.length === 0 && this.totalProducts > 0) {
      this.fetchPage();
    }
  }

  removeFromWishlist(productId: string): void {
    this.wishlistService.removeFromWishlist(productId);
    this.products = this.products.filter(p => p.id !== productId);
    this.totalProducts = Math.max(0, this.totalProducts - 1);
    this.totalPages = Math.max(1, Math.ceil(this.totalProducts / ITEMS_PER_PAGE));
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    if (this.products.length === 0 && this.totalProducts > 0) {
      this.fetchPage();
    }
  }

  addToCart(product: IProduct): void {
    this.cartService.addToCart(product);
  }

  private fetchPage(): void {
    this.wishlistService.loadFavoritesPaginated(this.currentPage, ITEMS_PER_PAGE).subscribe(result => {
      this.products = result.items;
      this.totalProducts = result.total;
      this.totalPages = Math.max(1, Math.ceil(result.total / ITEMS_PER_PAGE));
      this.cdr.markForCheck();
    });
  }
}
