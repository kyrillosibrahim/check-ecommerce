import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { IReview } from '../models/review.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly API = API_CONFIG.reviewsUrl;
  private http = inject(HttpClient);

  /** Approved reviews for a product (public). */
  getProductReviews(productId: string): Observable<IReview[]> {
    return this.http.get<IReview[]>(`${this.API}/product/${productId}`);
  }

  /** The current logged-in user's own review for a product (auth required). */
  getMyReview(productId: string): Observable<IReview | null> {
    return this.http.get<IReview | null>(`${this.API}/mine/${productId}`);
  }

  /** Create or update the current user's review (auth required). */
  submitReview(data: { productId: string; rating: number; comment: string }): Observable<{ message: string; review: IReview }> {
    return this.http.post<{ message: string; review: IReview }>(this.API, data);
  }
}
