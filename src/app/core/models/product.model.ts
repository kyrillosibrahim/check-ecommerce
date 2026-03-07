export interface IProduct {
  id: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  descriptionHtml?: string;
  descriptionHtmlAr?: string;
  price: number;
  discountPercentage: number;
  rating: number;
  ratingsCount: number;
  stock: number;
  categoryId: number;
  category: string;       // category slug for filtering
  images: string[];
  naturalImages?: string[];
  brand: string;
  merchant?: string;
  isFeatured: boolean;
  tags: string[];
  productForm?: {
    type: string;
    typeAr: string;
    count?: string;
  };
  comingSoon?: boolean;
  faq?: { q: string; a: string; qAr?: string; aAr?: string }[];

  wholesalePrice?: number;
  originalPrice?: number;
  discountedPrice?: number;
  merchantProfitPercent?: number;
  swiperImages?: string[];
  slug?: string;

  // Cart state (from API)
  inCart?: boolean;
  cartQuantity?: number;

  // Favorite state (from API)
  inFavorite?: boolean;

  // Special offers
  offers?: { text: string; textAr?: string; image?: string }[];
}
