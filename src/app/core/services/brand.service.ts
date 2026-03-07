import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { IBrand } from '../models/brand.model';
import { API_CONFIG } from '../config/api.config';

const SERVER_URL = API_CONFIG.baseUrl;

@Injectable({ providedIn: 'root' })
export class BrandService {
  private http = inject(HttpClient);
  private brandsSubject = new BehaviorSubject<IBrand[]>([]);
  private loaded = false;

  brands$ = this.brandsSubject.asObservable();

  getAll(): Observable<IBrand[]> {
    if (this.loaded) {
      return this.brands$;
    }
    return this.http.get<IBrand[]>(`${SERVER_URL}/api/brands`).pipe(
      map(brands => brands.map(b => ({
        ...b,
        image: b.image ? `${SERVER_URL}/uploads/${b.image}` : ''
      }))),
      tap(brands => {
        this.brandsSubject.next(brands);
        this.loaded = true;
      })
    );
  }
}
