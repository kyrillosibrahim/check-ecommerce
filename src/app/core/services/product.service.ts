import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, map, of, catchError } from 'rxjs';
import { IProduct } from '../models/product.model';
import { API_CONFIG } from '../config/api.config';

const SERVER_URL = API_CONFIG.baseUrl;

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  private productsSubject = new BehaviorSubject<IProduct[]>([]);
  products$ = this.productsSubject.asObservable();
  private loaded = false;

  private ensureLoaded(): void {
    if (this.loaded) return;
    this.loaded = true;
    this.http.get<any[]>(`${SERVER_URL}/api/products`).subscribe({
      next: (serverProducts) => {
        const mapped = serverProducts.map(p => this.mapServerProduct(p));
        this.productsSubject.next(mapped);
      },
      error: (err) => {
        console.error('Failed to load products from server:', err);
        this.loaded = false;
      }
    });
  }

  mapServerProduct(sp: any): IProduct {
    const uploadsBase = `${SERVER_URL}/uploads`;
    const toFullUrl = (img: string) => {
      if (!img) return '';
      if (img.startsWith('http') || img.startsWith('data:')) return img;
      return `${uploadsBase}/${img}`;
    };

    return {
      id: sp.id || `server-${sp.slug || ''}`,
      title: sp.title || sp.productName || '',
      titleAr: sp.titleAr || '',
      description: sp.description || '',
      descriptionAr: sp.descriptionAr || '',
      descriptionHtml: sp.descriptionHtml || '',
      descriptionHtmlAr: sp.descriptionHtmlAr || '',
      price: sp.price || sp.originalPrice || 0,
      discountPercentage: sp.discountPercentage || 0,
      rating: sp.rating || 0,
      ratingsCount: sp.ratingsCount || 0,
      stock: sp.stock || 0,
      categoryId: sp.categoryId || 0,
      category: sp.category || '',
      images: (sp.mainImages || []).map(toFullUrl),
      swiperImages: (sp.swiperImages || []).map(toFullUrl),
      naturalImages: (sp.normalImages || []).map(toFullUrl),
      brand: sp.brand || '',
      merchant: sp.merchant || '',
      isFeatured: sp.isFeatured || false,
      tags: sp.tags || [],
      filterTags: sp.filterTags || [],
      productForm: sp.productForm || undefined,
      comingSoon: sp.comingSoon || false,
      faq: sp.faq || [],
      wholesalePrice: sp.wholesalePrice,
      originalPrice: sp.originalPrice,
      discountedPrice: sp.discountedPrice,
      merchantProfitPercent: sp.merchantProfitPercentage,
      slug: sp.slug,
      inCart: sp.inCart || false,
      cartQuantity: sp.cartQuantity || 0,
      inFavorite: sp.inFavorite || false,
      offers: sp.offers || [],
      isWholesaleOffer: sp.isWholesaleOffer || false,
      offerPiecesCount: sp.offerPiecesCount,
      offerPrice: sp.offerPrice,
      hasVariants: !!sp.hasVariants,
      variantOptionType: sp.variantOptionType,
      variantOptionTypeAr: sp.variantOptionTypeAr,
      baseVariantName: sp.baseVariantName,
      baseVariantNameAr: sp.baseVariantNameAr,
      variants: (sp.variants || []).map((v: any) => ({
        id: v.id,
        name: v.name || '',
        nameAr: v.nameAr,
        mainImages: (v.mainImages || []).map(toFullUrl),
        naturalImages: (v.naturalImages || v.normalImages || []).map(toFullUrl),
        wholesalePrice: v.wholesalePrice,
        originalPrice: v.originalPrice,
        discountedPrice: v.discountedPrice,
        stock: v.stock,
      })),
    };
  }

  private slugify(text: string): string {
    return text.toLowerCase().trim()
      .replace(/[^\w\s\u0600-\u06FF-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /** Reload products from backend */
  refresh(): void {
    this.loaded = false;
    this.ensureLoaded();
  }

  getAll(): Observable<IProduct[]> {
    this.ensureLoaded();
    return this.products$;
  }

  getById(id: string): Observable<IProduct | undefined> {
    return this.products$.pipe(
      map(products => products.find(p => p.id === id))
    );
  }

  getOneProduct(id: string): Observable<{ product: IProduct; relatedProducts: IProduct[] } | undefined> {
    return this.http.get<any>(`${SERVER_URL}/api/products/getoneproduct/${id}`).pipe(
      map(res => ({
        product: this.mapServerProduct(res),
        relatedProducts: (res.relatedProducts || []).map((p: any) => this.mapServerProduct(p)),
      })),
      catchError(() => of(undefined))
    );
  }

  getByCategory(categorySlug: string): Observable<IProduct[]> {
    return this.products$.pipe(
      map(products => products.filter(p => p.category === categorySlug))
    );
  }

  getFeatured(): Observable<IProduct[]> {
    this.ensureLoaded();
    return this.products$.pipe(
      map(products => products.filter(p => p.isFeatured).slice(0, 8))
    );
  }

  getByIds(ids: string[]): Observable<IProduct[]> {
    return this.http.post<any[]>(`${SERVER_URL}/api/products/by-ids`, { ids }).pipe(
      map(products => products.map(p => this.mapServerProduct(p)))
    );
  }

  search(term: string): Observable<IProduct[]> {
    return this.searchProducts({ search: term }).pipe(map(res => res.products));
  }

  /** Server-side filtered search */
  searchProducts(filters: {
    search?: string;
    category?: string;
    subcategory?: string;
    brand?: string;
    featured?: boolean;
    limit?: number;
    filterTags?: string[];
    page?: number;
    hasDiscount?: boolean;
  }): Observable<{ products: IProduct[]; total: number }> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.subcategory) params = params.set('subcategory', filters.subcategory);
    if (filters.brand) params = params.set('brand', filters.brand);
    if (filters.featured) params = params.set('featured', 'true');
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.filterTags?.length) params = params.set('filterTags', filters.filterTags.join(','));
    if (filters.hasDiscount) params = params.set('hasDiscount', 'true');

    return this.http.get<any>(`${SERVER_URL}/api/products`, { params }).pipe(
      map(res => {
        const products = Array.isArray(res) ? res : (res.products || res.data || []);
        const mapped = products.map((p: any) => this.mapServerProduct(p));
        const total = Array.isArray(res) ? mapped.length : (res.total ?? res.count ?? mapped.length);
        return { products: mapped, total };
      }),
      catchError(() => of({ products: [], total: 0 }))
    );
  }

  /** Update a product's cart state in the cached list */
  updateProductCartState(productId: string, inCart: boolean, cartQuantity: number): void {
    const products = this.productsSubject.getValue();
    const updated = products.map(p =>
      p.id === productId ? { ...p, inCart, cartQuantity } : p
    );
    this.productsSubject.next(updated);
  }

  /** Clear inCart for all products */
  clearAllCartState(): void {
    const products = this.productsSubject.getValue();
    const updated = products.map(p => ({ ...p, inCart: false, cartQuantity: 0 }));
    this.productsSubject.next(updated);
  }

  /** Update a product's favorite state in the cached list */
  updateProductFavoriteState(productId: string, inFavorite: boolean): void {
    const products = this.productsSubject.getValue();
    const updated = products.map(p =>
      p.id === productId ? { ...p, inFavorite } : p
    );
    this.productsSubject.next(updated);
  }

  /** Clear inFavorite for all products */
  clearAllFavoriteState(): void {
    const products = this.productsSubject.getValue();
    const updated = products.map(p => ({ ...p, inFavorite: false }));
    this.productsSubject.next(updated);
  }

  generateId(): string {
    return 'prod-' + Date.now().toString(36);
  }
}
