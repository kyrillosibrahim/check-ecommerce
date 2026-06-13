import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { IBanner } from '../models/banner.model';
import { API_CONFIG } from '../config/api.config';

const SERVER_URL = API_CONFIG.baseUrl;

@Injectable({ providedIn: 'root' })
export class BannerService {
  private http = inject(HttpClient);

  private banners$ = this.http.get<IBanner[]>(`${SERVER_URL}/api/banners`).pipe(
    map(banners => banners.map(b => ({
      ...b,
      image: b.image
        ? b.image.startsWith('http') ? b.image : `${SERVER_URL}/uploads/${b.image}`
        : '',
      link: b.link && b.link.startsWith('http')
        ? b.link.replace(/^https?:\/\/[^/]+/, '')
        : b.link
    }))),
    shareReplay(1),
  );

  getAll(): Observable<IBanner[]> {
    return this.banners$;
  }

  getByPage(page: IBanner['page']): Observable<IBanner[]> {
    return this.banners$.pipe(
      map(banners => banners.filter(b => b.page === page))
    );
  }
}
