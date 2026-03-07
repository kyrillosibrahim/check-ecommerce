import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';

@Pipe({ name: 'localize', pure: false })
export class LocalizePipe implements PipeTransform {
  private translationService = inject(TranslationService);

  transform(enValue: string, arValue?: string): string {
    return (this.translationService.isArabic() && arValue) ? arValue : enValue;
  }
}
