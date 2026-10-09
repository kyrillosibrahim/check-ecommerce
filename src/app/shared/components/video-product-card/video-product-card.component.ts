import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IProduct } from '../../../core/models/product.model';
import { unitPriceAfterDiscount } from '../../../core/utils/pricing.util';
import { CldImagePipe } from '../../pipes/cld-image.pipe';
import { EgpCurrencyPipe } from '../../pipes/egp-currency.pipe';
import { LocalizePipe } from '../../pipes/localize.pipe';

/**
 * Product thumbnail + name + price shown over a video (Watch feed, home "natural products").
 * Parents decide where it sits and what's behind it; this only lays out the content.
 */
@Component({
  selector: 'app-video-product-card',
  imports: [CldImagePipe, EgpCurrencyPipe, LocalizePipe],
  templateUrl: './video-product-card.component.html',
  styleUrl: './video-product-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.compact]': 'compact()' },
})
export class VideoProductCardComponent {
  product = input.required<IProduct>();
  /** Smaller thumbnail and text for narrow cards */
  compact = input(false);

  price = computed(() => unitPriceAfterDiscount(this.product()));
  hasDiscount = computed(() => this.price() < this.product().price);
}
