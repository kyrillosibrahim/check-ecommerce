import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { IProduct } from '../models/product.model';
import { API_CONFIG } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class WholesaleOfferService {
  private http = inject(HttpClient);

  /** Fetch all wholesale offers and map them into the IProduct shape so existing UI components reuse. */
  getAll(): Observable<IProduct[]> {
    return this.http.get<any[]>(API_CONFIG.wholesaleOffersUrl).pipe(
      map(list => (list || []).map(o => this.mapToProduct(o))),
      catchError(() => of([] as IProduct[]))
    );
  }

  private mapToProduct(o: any): IProduct {
    const naturalImages: string[] = o.normalImages || [];
    const fallbackImages: string[] = naturalImages.length ? naturalImages : (o.mainImages || []);
    return {
      id: o.id || `wholesale-${o.slug || ''}`,
      title: o.title || '',
      titleAr: o.titleAr || '',
      description: o.description || '',
      descriptionAr: o.descriptionAr || '',
      descriptionHtml: o.descriptionHtml || '',
      descriptionHtmlAr: o.descriptionHtmlAr || '',
      price: o.offerPrice || o.wholesalePrice || o.originalPrice || o.price || 0,
      discountPercentage: 0,
      rating: 0,
      ratingsCount: 0,
      stock: 999,
      categoryId: 0,
      category: 'wholesale',
      images: fallbackImages,
      swiperImages: o.swiperImages || [],
      naturalImages,
      brand: '',
      isFeatured: false,
      tags: [],
      filterTags: [],
      faq: o.faq || [],
      offers: o.offers || [],
      wholesalePrice: o.wholesalePrice,
      originalPrice: o.originalPrice,
      discountedPrice: o.discountedPrice,
      merchantProfitPercent: o.merchantProfitPercentage,
      minWholesaleQuantity: o.minWholesaleQuantity || 0,
      offerPiecesCount: o.offerPiecesCount || 0,
      offerPrice: o.offerPrice || 0,
      slug: o.slug,
      inCart: false,
      cartQuantity: 0,
      inFavorite: false,
      isWholesaleOffer: true,
    };
  }
}
