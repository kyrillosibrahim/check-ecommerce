import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { FloatingActionsComponent } from './shared/components/floating-actions/floating-actions.component';
import { AuthDrawerComponent } from './shared/components/auth-drawer/auth-drawer.component';
import { QuickViewModalComponent } from './shared/components/quick-view-modal/quick-view-modal.component';
import { SiteSettingsService } from './core/services/settings.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, FloatingActionsComponent, AuthDrawerComponent, QuickViewModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private settingsService = inject(SiteSettingsService);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  /** Pages where the footer should be hidden on mobile */
  private noFooterRoutes = ['/', '/profile', '/wishlist', '/cart', '/offers', '/checkout', '/watch'];
  /** Pages where the header & floating actions should be hidden on mobile */
  private noChromeRoutes = ['/cart', '/checkout', '/watch'];
  hideFooterOnMobile = signal(false);
  hideChromeOnMobile = signal(false);

  ngOnInit(): void {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(e => {
      const url = e.urlAfterRedirects.split('?')[0];
      this.hideFooterOnMobile.set(this.noFooterRoutes.includes(url));
      this.hideChromeOnMobile.set(this.noChromeRoutes.includes(url));
    });
    if (!isPlatformBrowser(this.platformId)) return;

    this.settingsService.getSettings().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(settings => {
      const root = document.documentElement;
      const { colors } = settings;

      // Store all color values
      root.style.setProperty('--sz-accent-light', colors.primaryLight);
      root.style.setProperty('--sz-accent-hover-light', colors.secondaryLight);
      root.style.setProperty('--sz-accent-dark', colors.primaryDark);
      root.style.setProperty('--sz-accent-hover-dark', colors.secondaryDark);

      // Apply based on current theme
      this.applyThemeColors(root);
    });

    // Re-apply on theme changes
    const observer = new MutationObserver(() => {
      this.applyThemeColors(document.documentElement);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  private applyThemeColors(root: HTMLElement): void {
    const isDark = root.getAttribute('data-bs-theme') === 'dark';
    const accentLight = root.style.getPropertyValue('--sz-accent-light');
    const accentHoverLight = root.style.getPropertyValue('--sz-accent-hover-light');
    const accentDark = root.style.getPropertyValue('--sz-accent-dark');
    const accentHoverDark = root.style.getPropertyValue('--sz-accent-hover-dark');

    if (isDark) {
      if (accentDark) root.style.setProperty('--sz-accent', accentDark);
      if (accentHoverDark) root.style.setProperty('--sz-accent-hover', accentHoverDark);
    } else {
      if (accentLight) root.style.setProperty('--sz-accent', accentLight);
      if (accentHoverLight) root.style.setProperty('--sz-accent-hover', accentHoverLight);
    }
  }
}
