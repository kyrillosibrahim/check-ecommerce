import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(c => c.HomeComponent),
    title: 'Check - الرئيسية'
  },
  {
    path: 'products',
    loadComponent: () => import('./features/products/products.component').then(c => c.ProductsComponent),
    title: 'Check - المنتجات'
  },
  {
    path: 'offers',
    loadComponent: () => import('./features/offers/offers.component').then(c => c.OffersComponent),
    title: 'Check - العروض والخصومات'
  },
  {
    path: 'brands',
    loadComponent: () => import('./features/brands/brands.component').then(c => c.BrandsComponent),
    title: 'Check - العلامات التجارية'
  },
  {
    path: 'product/:id',
    loadComponent: () => import('./features/product-details/product-details.component').then(c => c.ProductDetailsComponent),
    title: 'Check - تفاصيل المنتج'
  },
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart.component').then(c => c.CartComponent),
    title: 'Check - سلة التسوق'
  },
  {
    path: 'wishlist',
    canActivate: [authGuard],
    loadComponent: () => import('./features/wishlist/wishlist.component').then(c => c.WishlistComponent),
    title: 'Check - المفضلة'
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () => import('./features/checkout/checkout.component').then(c => c.CheckoutComponent),
    title: 'Check - اتمام الطلب'
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component').then(c => c.ProfileComponent),
    title: 'Check - حسابي'
  },
  {
    path: 'dashboard/governorates',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/dashboard/governorates.component').then(c => c.GovernoratesDashboardComponent),
    title: 'Check - المحافظات وأسعار الشحن'
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then(c => c.NotFoundComponent),
    title: '404 - صفحة غير موجودة'
  }
];
