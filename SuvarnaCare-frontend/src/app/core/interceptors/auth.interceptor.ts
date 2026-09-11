import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

/**
 * Angular HTTP Request Interceptor for SuvarnaCare API calls.
 * Automatically attaches Bearer JWT authorization headers from AuthService session,
 * sets standard content headers, and handles 401 Unauthorized responses.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  let headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const authReq = req.clone({
    setHeaders: headers,
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn('⚠️ [AuthInterceptor] 401 Unauthorized received. Session expired or token invalid.');
      }
      return throwError(() => error);
    })
  );
};
