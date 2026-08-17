import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { CldImagePipe } from '../../pipes/cld-image.pipe';
import { SiteSettingsService } from '../../../core/services/settings.service';
import { TranslationService } from '../../../core/services/translation.service';

interface TrustItem {
  icon: string;
  titleKey: string;
  descKey: string;
  /** When true, render the site logo (from settings) instead of `icon`. */
  useLogo?: boolean;
}

@Component({
  selector: 'app-trust-panel',
  imports: [TranslatePipe, CldImagePipe],
  templateUrl: './trust-panel.component.html',
  styleUrl: './trust-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrustPanelComponent {
  private settingsService = inject(SiteSettingsService);
  private translationService = inject(TranslationService);
  private destroyRef = inject(DestroyRef);

  /** Site logo (dynamic, from settings). Falls back to the bundled asset. */
  readonly logoUrl = signal('assets/logobluewithoutbg.png');

  readonly trustItems: TrustItem[] = [
    { icon: 'assets/iconsd/148879f265.png',  titleKey: 'checkout.trust_original_title',  descKey: 'checkout.trust_original_desc' },
    { icon: 'assets/iconsd/2806135749.png',  titleKey: 'checkout.trust_packaging_title', descKey: 'checkout.trust_packaging_desc' },
    { icon: 'assets/iconsd/434e05ab7e.png',  titleKey: 'checkout.trust_support_title',   descKey: 'checkout.trust_support_desc' },
    { icon: 'assets/iconsd/675e62576b.webp', titleKey: 'checkout.trust_cod_title',        descKey: 'checkout.trust_cod_desc' },
    { icon: '', useLogo: true,               titleKey: 'checkout.trust_return_title',     descKey: 'checkout.trust_return_desc' },
    { icon: 'assets/iconsd/privacy.png',     titleKey: 'checkout.trust_sameday_title',   descKey: 'checkout.trust_sameday_desc' },
  ];

  constructor() {
    this.settingsService.getSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(settings => {
        const url = this.settingsService.getLogoUrlByLang(settings, this.translationService.currentLang());
        if (url) {
          this.logoUrl.set(url);
        }
      });
  }
}
