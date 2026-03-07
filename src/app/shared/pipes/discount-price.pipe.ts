import { Pipe, PipeTransform } from '@angular/core';
import { IProduct } from '../../core/models/product.model';

/**
 * Calculates final price after applying discount percentage.
 * Usage: {{ product | discountPrice | currency }}
 */
@Pipe({ name: 'discountPrice' })
export class DiscountPricePipe implements PipeTransform {
  transform(product: IProduct): number {
    return product.price * (1 - product.discountPercentage / 100);
  }
}
