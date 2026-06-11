import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AuthDrawerService } from '../services/auth-drawer.service';

/**
 * When an authenticated API call comes back 401 (e.g. an expired/invalid token),
 * clear the stale session and prompt a fresh login — instead of silently failing
 * every authed request while the UI still looks "logged in".
 *
 * Skips the auth endpoints themselves so a wrong-password login doesn't trigger a
 * logout loop, and only acts once (logout flips isLoggedIn to false).
 */
export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  const auth = inject(AuthService);
  const drawer = inject(AuthDrawerService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (
        isBrowser &&
        err.status === 401 &&
        auth.isLoggedIn() &&
        !req.url.includes('/api/auth/')
      ) {
        auth.logout();
        drawer.open('login');
      }
      return throwError(() => err);
    })
  );
};
