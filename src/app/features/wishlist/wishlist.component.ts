import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { WishlistService } from '../../core/services/wishlist.service';
import { CartService } from '../../core/services/cart.service';
import { IProduct } from '../../core/models/product.model';
import { DiscountPricePipe } from '../../shared/pipes/discount-price.pipe';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LocalizePipe } from '../../shared/pipes/localize.pipe';
import { TranslationService } from '../../core/services/translation.service';
import { EgpCurrencyPipe } from '../../shared/pipes/egp-currency.pipe';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-wishlist',
  imports: [RouterLink, AsyncPipe, EgpCurrencyPipe, DiscountPricePipe, TranslatePipe, LocalizePipe, SkeletonLoaderComponent],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.scss'
})
export class WishlistComponent {
  translationService = inject(TranslationService);
  wishlistService = inject(WishlistService);
  private cartService = inject(CartService);

  constructor() {
    this.wishlistService.loadFavorites();
  }

  moveToCart(productId: string): void {
    this.wishlistService.moveToCart(productId);
  }

  removeFromWishlist(productId: string): void {
    this.wishlistService.removeFromWishlist(productId);
  }

  addToCart(product: IProduct): void {
    this.cartService.addToCart(product);
  }
}
