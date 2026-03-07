import { Component, HostListener, signal, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { SiteSettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-floating-actions',
  standalone: true,
  templateUrl: './floating-actions.component.html',
  styleUrl: './floating-actions.component.scss',
})
export class FloatingActionsComponent implements OnInit {
  private settingsService = inject(SiteSettingsService);
  private cdr = inject(ChangeDetectorRef);

  isVisible = signal(false);
  isOpen = signal(false);
  social = { facebook: '', instagram: '', whatsapp: '', phone: '' };

  ngOnInit(): void {
    this.settingsService.getSettings().subscribe(settings => {
      if (settings.social) {
        this.social = settings.social;
      }
      this.cdr.markForCheck();
    });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isVisible.set(window.scrollY > window.innerHeight * 0.25);
    if (window.scrollY <= window.innerHeight * 0.25) {
      this.isOpen.set(false);
    }
  }

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.isOpen.set(false);
  }
}
