import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AuthDrawerService } from '../services/auth-drawer.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const authDrawerService = inject(AuthDrawerService);

  if (authService.isLoggedIn()) {
    return true;
  }
  authDrawerService.open('login', state.url);
  return false;
};
