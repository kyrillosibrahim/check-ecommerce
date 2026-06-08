import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { IMAGE_CONFIG, IMAGE_LOADER, ImageLoaderConfig, registerLocaleData } from '@angular/common';
import localeArEg from '@angular/common/locales/ar-EG';

registerLocaleData(localeArEg, 'ar-EG');
import { provideRouter, withPreloading, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideClientHydration, withEventReplay, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { SelectivePreloadStrategy } from './core/strategies/selective-preload.strategy';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

import { routes } from './app.routes';
import { cacheInterceptor } from './core/interceptors/cache.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { securityInterceptor } from './core/interceptors/security.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withPreloading(SelectivePreloadStrategy), withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(withFetch(), withInterceptors([securityInterceptor, authInterceptor, cacheInterceptor])),
    provideClientHydration(
      withEventReplay(),
      withHttpTransferCacheOptions({ includePostRequests: false, filter: r => r.method === 'GET' })
    ),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '[data-theme="dark"]'
        }
      }
    }),
    {
      provide: IMAGE_CONFIG,
      useValue: { disableImageSizeWarning: false, disableImageLazyLoadWarning: false }
    },
    {
      provide: IMAGE_LOADER,
      useValue: (config: ImageLoaderConfig) => {
        const src = config.src;
        if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
          const transforms = ['f_auto', 'q_auto'];
          if (config.width) transforms.push(`w_${config.width}`);
          return src.replace('/upload/', `/upload/${transforms.join(',')}/`);
        }
        return src;
      }
    }
  ]
};
