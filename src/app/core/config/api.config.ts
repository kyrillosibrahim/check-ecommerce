import { environment } from '../../../environments/environment';

export const API_CONFIG = {
  baseUrl: environment.baseUrl,
  get productsUrl() { return `${this.baseUrl}/api/products`; },
  get categoriesUrl() { return `${this.baseUrl}/api/categories`; },
  get brandsUrl() { return `${this.baseUrl}/api/brands`; },
  get bannersUrl() { return `${this.baseUrl}/api/banners`; },
  get uploadsUrl() { return `${this.baseUrl}/uploads`; },
  get authUrl() { return `${this.baseUrl}/api/auth`; },
  get cartUrl() { return `${this.baseUrl}/api/cart`; },
  get favoritesUrl() { return `${this.baseUrl}/api/favorites`; },
  get governoratesUrl() { return `${this.baseUrl}/api/governorates`; },
  get ordersUrl() { return `${this.baseUrl}/api/orders`; },
  get settingsUrl() { return `${this.baseUrl}/api/settings`; },
  get wholesaleOffersUrl() { return `${this.baseUrl}/api/wholesale-offers`; },
  get reviewsUrl() { return `${this.baseUrl}/api/reviews`; },
  get notificationsUrl() { return `${this.baseUrl}/api/notifications`; },
  get couponsUrl() { return `${this.baseUrl}/api/coupons`; },
  get siteVisitsUrl() { return `${this.baseUrl}/api/site-visits`; },
  get customerActivityUrl() { return `${this.baseUrl}/api/customer-activity`; },
};
