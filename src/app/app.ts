import { ChangeDetectionStrategy, Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { FloatingActionsComponent } from './shared/components/floating-actions/floating-actions.component';
import { AuthDrawerComponent } from './shared/components/auth-drawer/auth-drawer.component';
import { SiteSettingsService } from './core/services/settings.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, FloatingActionsComponent, AuthDrawerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private settingsService = inject(SiteSettingsService);
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.settingsService.getSettings().subscribe(settings => {
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
