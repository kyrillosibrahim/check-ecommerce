import { Injectable, inject, DOCUMENT } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { API_CONFIG } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private meta = inject(Meta);
  private titleService = inject(Title);
  private document = inject(DOCUMENT);

  private readonly siteUrl = 'https://check-ecommerce.onrender.com';
  private readonly siteName = 'Kaf';
  private readonly defaultImage = `${this.siteUrl}/assets/logobluewithoutbg.png`;

  updateTitle(title: string): void {
    this.titleService.setTitle(title);
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ name: 'twitter:title', content: title });
  }

  updateDescription(description: string): void {
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ name: 'twitter:description', content: description });
  }

  updateImage(imageUrl: string): void {
    const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${API_CONFIG.uploadsUrl}/${imageUrl}`;
    this.meta.updateTag({ property: 'og:image', content: fullUrl });
    this.meta.updateTag({ name: 'twitter:image', content: fullUrl });
  }

  updateUrl(path: string): void {
    const url = `${this.siteUrl}${path}`;
    this.meta.updateTag({ property: 'og:url', content: url });
    this.updateCanonical(url);
  }

  updateType(type: string): void {
    this.meta.updateTag({ property: 'og:type', content: type });
  }

  setProductMeta(product: { title: string; description: string; price: number; discountPercentage: number; images: string[]; id: string; brand: string; stock: number; metaTitle?: string; metaDescription?: string; seoKeywords?: string[] }): void {
    const finalPrice = product.price * (1 - product.discountPercentage / 100);

    const seoTitle = product.metaTitle || product.title;
    this.updateTitle(`${seoTitle} | ${this.siteName}`);

    const seoDescription = product.metaDescription || product.description?.slice(0, 160) || `${product.title} - تسوق الآن من ${this.siteName}`;
    this.updateDescription(seoDescription);

    if (product.seoKeywords?.length) {
      this.meta.updateTag({ name: 'keywords', content: product.seoKeywords.join(', ') });
    }

    this.updateType('product');
    this.updateUrl(`/product/${product.id}`);

    if (product.images?.[0]) {
      this.updateImage(product.images[0]);
    }

    // Product-specific OG tags
    this.meta.updateTag({ property: 'product:price:amount', content: finalPrice.toFixed(2) });
    this.meta.updateTag({ property: 'product:price:currency', content: 'EGP' });
    this.meta.updateTag({ property: 'product:brand', content: product.brand || '' });
    this.meta.updateTag({ property: 'product:availability', content: product.stock > 0 ? 'in stock' : 'out of stock' });
  }

  setPageMeta(config: { title: string; description: string; path: string; image?: string }): void {
    this.updateTitle(`${config.title} | ${this.siteName}`);
    this.updateDescription(config.description);
    this.updateType('website');
    this.updateUrl(config.path);
    this.updateImage(config.image || this.defaultImage);
  }

  setJsonLd(data: object): void {
    this.removeJsonLd();
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'seo-json-ld';
    script.text = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  removeJsonLd(): void {
    const existing = this.document.getElementById('seo-json-ld');
    if (existing) existing.remove();
  }

  setProductJsonLd(product: { title: string; description: string; price: number; discountPercentage: number; images: string[]; id: string; brand: string; stock: number; rating: number; ratingsCount: number; metaTitle?: string; metaDescription?: string; seoKeywords?: string[] }): void {
    const finalPrice = product.price * (1 - product.discountPercentage / 100);
    const imageUrl = product.images?.[0]
      ? (product.images[0].startsWith('http') ? product.images[0] : `${API_CONFIG.uploadsUrl}/${product.images[0]}`)
      : this.defaultImage;

    const jsonLd: any = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.metaTitle || product.title,
      description: product.metaDescription || product.description?.slice(0, 500) || product.title,
      image: imageUrl,
      brand: { '@type': 'Brand', name: product.brand || this.siteName },
      offers: {
        '@type': 'Offer',
        price: finalPrice.toFixed(2),
        priceCurrency: 'EGP',
        availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: `${this.siteUrl}/product/${product.id}`,
      },
    };

    if (product.rating > 0 && product.ratingsCount > 0) {
      jsonLd.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: product.rating.toString(),
        reviewCount: product.ratingsCount.toString(),
      };
    }

    if (product.seoKeywords?.length) {
      jsonLd.keywords = product.seoKeywords.join(', ');
    }

    this.setJsonLd(jsonLd);
  }

  private updateCanonical(url: string): void {
    let link = this.document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  resetToDefaults(): void {
    this.updateTitle('Check - تسوق أونلاين | أفضل المنتجات بأفضل الأسعار');
    this.updateDescription('Check - متجرك الإلكتروني للتسوق أونلاين. اكتشف أفضل المنتجات بأفضل الأسعار مع شحن سريع لجميع محافظات مصر.');
    this.updateType('website');
    this.updateUrl('/');
    this.updateImage(this.defaultImage);
    this.removeJsonLd();
  }
}
