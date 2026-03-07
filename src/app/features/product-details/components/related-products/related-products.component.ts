import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IProduct } from '../../../../core/models/product.model';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-related-products',
  imports: [ProductCardComponent],
  templateUrl: './related-products.component.html',
  styleUrl: './related-products.component.scss'
})
export class RelatedProductsComponent {
  @Input({ required: true }) products: IProduct[] = [];
  @Output() addToCart = new EventEmitter<IProduct>();
  @Output() addToWishlist = new EventEmitter<IProduct>();
}
