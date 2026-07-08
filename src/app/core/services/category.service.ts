import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, shareReplay, tap, map } from 'rxjs';
import { ICategory } from '../models/category.model';
import { IBrand } from '../models/brand.model';
import { API_CONFIG } from '../config/api.config';
import { withLocalCache } from '../utils/local-cache.util';

const SERVER_URL = API_CONFIG.baseUrl;

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private categoriesSubject = new BehaviorSubject<ICategory[]>([]);
  private allCategories$?: Observable<ICategory[]>;

  categories$ = this.categoriesSubject.asObservable();

  getAll(): Observable<ICategory[]> {
    if (!this.allCategories$) {
      const request$ = this.http.get<ICategory[]>(`${SERVER_URL}/api/categories/detailed`).pipe(
        map(cats => cats.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          image: c.image ? (c.image.startsWith('http') ? c.image : SERVER_URL + c.image) : '',
          description: c.description || '',
          icon: c.icon || '',
          productCount: c.productCount || 0,
          subcategories: (c.subcategories || []).map(sub => ({
            ...sub,
            image: sub.image ? (sub.image.startsWith('http') ? sub.image : SERVER_URL + sub.image) : '',
          })),
          famousBrands: (c.famousBrands || []).map((b: IBrand) => ({
            ...b,
            image: b.image ? (b.image.startsWith('http') ? b.image : `${SERVER_URL}/uploads/${b.image}`) : '',
          })),
          filterTags: c.filterTags || [],
        }))),
        tap(cats => this.categoriesSubject.next(cats)),
        shareReplay(1)
      );
      this.allCategories$ = withLocalCache('kaf:categories', request$, this.platformId);
    }
    return this.allCategories$;
  }

  getBySlug(slug: string): Observable<ICategory | undefined> {
    return this.getAll().pipe(
      map(cats => cats.find(c => c.slug === slug))
    );
  }
}
