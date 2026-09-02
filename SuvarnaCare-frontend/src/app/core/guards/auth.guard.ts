import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

/**
 * Protects application routes (e.g. /tabs).
 * Redirects unauthenticated users to /login.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Preserve attempted URL for redirect if desired
  return router.createUrlTree(['/login']);
};

/**
 * Protects guest routes (e.g. /login, /register).
 * Redirects already authenticated users to /tabs/tab1.
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return router.createUrlTree(['/tabs/tab1']);
  }

  return true;
};
