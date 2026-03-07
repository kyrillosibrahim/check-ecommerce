export const API_CONFIG = {
  baseUrl: 'https://check-ecommerce.onrender.com',
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
};
