import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { SiteSettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent implements OnInit {
  private settingsService = inject(SiteSettingsService);
  private cdr = inject(ChangeDetectorRef);

  currentYear = new Date().getFullYear();
  logoUrl = 'assets/logobluewithoutbg.png';
  social = { facebook: '', instagram: '', whatsapp: '', phone: '' };

  ngOnInit(): void {
    this.settingsService.getSettings().subscribe(settings => {
      if (settings.logo) {
        this.logoUrl = this.settingsService.getLogoUrl(settings.logo);
      }
      if (settings.social) {
        this.social = settings.social;
      }
      this.cdr.markForCheck();
    });
  }
}
