import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IProduct } from '../../../../core/models/product.model';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-featured-products',
  imports: [ProductCardComponent, RouterLink, TranslatePipe],
  templateUrl: './featured-products.component.html',
  styleUrl: './featured-products.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedProductsComponent {
  @Input({ required: true }) products: IProduct[] = [];
  @Output() addToCart = new EventEmitter<IProduct>();
  @Output() addToWishlist = new EventEmitter<IProduct>();
}
