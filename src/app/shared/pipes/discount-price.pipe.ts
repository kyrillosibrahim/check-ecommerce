import { Pipe, PipeTransform } from '@angular/core';
import { IProduct } from '../../core/models/product.model';
import { unitPriceAfterDiscount } from '../../core/utils/pricing.util';

/**
 * Calculates final price after applying discount percentage.
 * Usage: {{ product | discountPrice | currency }}
 */
@Pipe({ name: 'discountPrice' })
export class DiscountPricePipe implements PipeTransform {
  transform(product: IProduct): number {
    return unitPriceAfterDiscount(product);
  }
}
