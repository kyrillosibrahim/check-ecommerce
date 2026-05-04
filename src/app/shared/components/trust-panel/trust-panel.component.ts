import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-trust-panel',
  imports: [TranslatePipe],
  templateUrl: './trust-panel.component.html',
  styleUrl: './trust-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrustPanelComponent {
  readonly trustItems = [
    { icon: 'assets/iconsd/148879f265.png',  titleKey: 'checkout.trust_original_title',  descKey: 'checkout.trust_original_desc' },
    { icon: 'assets/iconsd/2806135749.png',  titleKey: 'checkout.trust_packaging_title', descKey: 'checkout.trust_packaging_desc' },
    { icon: 'assets/iconsd/434e05ab7e.png',  titleKey: 'checkout.trust_support_title',   descKey: 'checkout.trust_support_desc' },
    { icon: 'assets/iconsd/675e62576b.webp', titleKey: 'checkout.trust_cod_title',        descKey: 'checkout.trust_cod_desc' },
    { icon: 'assets/iconsd/ff1b3550-fdc5-43b0-8430-22fe2af59834_LE_upscale_prime_light_ai_100_remove_background_general_clip_to_object_off.png', titleKey: 'checkout.trust_return_title', descKey: 'checkout.trust_return_desc' },
    { icon: 'assets/iconsd/privacy.png',     titleKey: 'checkout.trust_sameday_title',   descKey: 'checkout.trust_sameday_desc' },
  ];
}
