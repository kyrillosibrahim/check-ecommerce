import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';

@Pipe({ name: 'egpCurrency', pure: false })
export class EgpCurrencyPipe implements PipeTransform {
  private translationService = inject(TranslationService);

  transform(value: number | null | undefined): string {
    if (value == null) return '';
    const formatted = value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return this.translationService.isArabic()
      ? `${formatted} ج.م`
      : `EGP ${formatted}`;
  }
}
