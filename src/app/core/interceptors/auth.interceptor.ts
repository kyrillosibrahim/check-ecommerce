import { HttpInterceptorFn } from '@angular/common/http';

const STORAGE_KEY = 'sz-current-user';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const user = JSON.parse(data);
      if (user?.token) {
        req = req.clone({
          setHeaders: { Authorization: `Bearer ${user.token}` },
        });
      }
    }
  } catch { /* ignore */ }

  return next(req);
};
