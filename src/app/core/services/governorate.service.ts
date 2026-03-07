import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, switchMap } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';
import { IGovernorateApi, ICityApi } from '../models/governorate.model';
import { API_CONFIG } from '../config/api.config';

const SERVER_URL = API_CONFIG.baseUrl;

@Injectable({ providedIn: 'root' })
export class GovernorateService {
  private http = inject(HttpClient);

  private governoratesCache: IGovernorateApi[] | null = null;
  private governorates$: Observable<IGovernorateApi[]> | null = null;

  getGovernorates(): Observable<IGovernorateApi[]> {
    if (this.governoratesCache) {
      return of(this.governoratesCache);
    }
    if (!this.governorates$) {
      this.governorates$ = this.http.get<IGovernorateApi[]>(`${SERVER_URL}/api/governorates`).pipe(
        tap(data => this.governoratesCache = data),
        shareReplay(1)
      );
    }
    return this.governorates$;
  }

  getCities(governorateId: number): Observable<ICityApi[]> {
    return this.http.get<ICityApi[]>(`${SERVER_URL}/api/governorates/${governorateId}/cities`);
  }

  buildArabicAddress(governorateName: string, cityName: string): Observable<{ govAr: string; cityAr: string }> {
    return this.getGovernorates().pipe(
      switchMap(govs => {
        const gov = govs.find(g => g.governorate_name_en === governorateName);
        if (!gov) {
          return of({ govAr: governorateName, cityAr: cityName });
        }
        return this.getCities(gov.id).pipe(
          map(cities => {
            const city = cities.find(c => c.city_name_en === cityName);
            return {
              govAr: gov.governorate_name_ar,
              cityAr: city?.city_name_ar ?? cityName,
            };
          })
        );
      })
    );
  }
}
