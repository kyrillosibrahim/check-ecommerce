import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, Input, OnChanges, PLATFORM_ID, signal, SimpleChanges, ViewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Swiper from 'swiper';
import { Autoplay } from 'swiper/modules';
import { CldImagePipe } from '../../../../shared/pipes/cld-image.pipe';
import { VideoProductCardComponent } from '../../../../shared/components/video-product-card/video-product-card.component';
import { ProductService } from '../../../../core/services/product.service';
import { IProduct } from '../../../../core/models/product.model';
import { productIdFromLink } from '../../../../core/utils/product-link.util';

export interface INaturalProductItem {
  video: string;
  link: string;
}

const VIDEO_EXT_RE = /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i;

@Component({
  selector: 'app-natural-products',
  imports: [CldImagePipe, VideoProductCardComponent],
  templateUrl: './natural-products.component.html',
  styleUrl: './natural-products.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NaturalProductsComponent implements AfterViewInit, OnChanges {
  @Input() items: INaturalProductItem[] = [];
  @ViewChild('swiperRef') swiperRef!: ElementRef<HTMLElement>;

  private platformId = inject(PLATFORM_ID);
  private productService = inject(ProductService);
  private destroyRef = inject(DestroyRef);
  private swiper?: Swiper;

  /** Products linked from the cards, keyed by id (filled after one batch request) */
  products = signal<Map<string, IProduct>>(new Map());

  productFor(item: INaturalProductItem): IProduct | undefined {
    const id = productIdFromLink(item.link);
    return id ? this.products().get(id) : undefined;
  }

  isVideo(url: string): boolean {
    if (!url) return false;
    if (url.includes('/video/upload/')) return true;
    return VIDEO_EXT_RE.test(url);
  }

  /**
   * A Cloudinary-generated poster (first frame) for a video URL, so the card
   * shows an image immediately on mobile — where preload="metadata" often renders
   * black until the clip plays. Returns '' for non-Cloudinary videos.
   */
  posterFor(url: string): string {
    const marker = '/video/upload/';
    if (!url || !url.includes(marker)) return '';
    const start = url.indexOf(marker) + marker.length;
    const rest = url.slice(start).replace(/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i, '.jpg');
    return `${url.slice(0, start)}so_0,f_auto,q_auto,w_400/${rest}`;
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId) && this.items.length > 0) {
      this.initSwiper();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) this.loadProducts();
    if (changes['items'] && this.swiperRef && isPlatformBrowser(this.platformId)) {
      this.swiper?.destroy(true, true);
      if (this.items.length > 0) this.initSwiper();
    }
  }

  /** One request for every linked product; on failure the cards just show without it. */
  private loadProducts(): void {
    const ids = [...new Set(this.items.map(i => productIdFromLink(i.link)).filter((id): id is string => !!id))];
    if (!ids.length) return;
    this.productService.getByIds(ids).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: products => this.products.set(new Map(products.map(p => [p.id, p]))),
      error: () => {},
    });
  }

  private initSwiper(): void {
    this.swiper = new Swiper(this.swiperRef.nativeElement, {
      modules: [Autoplay],
      slidesPerView: 1,
      spaceBetween: 12,
      loop: this.items.length > 2,
      grabCursor: true,
      speed: 600,
      watchSlidesProgress: true,
      autoplay: {
        delay: 2000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
      breakpoints: {
        576: { slidesPerView: 2, spaceBetween: 12 },
        768: { slidesPerView: 3, spaceBetween: 14 },
        992: { slidesPerView: 4, spaceBetween: 16 },
        1200: { slidesPerView: 5, spaceBetween: 16 },
      },
      on: {
        afterInit: () => this.playVisibleVideos(),
        slideChangeTransitionEnd: () => this.playVisibleVideos(),
      },
    });
    setTimeout(() => this.playVisibleVideos(), 200);
  }

  /**
   * Only the slides currently in view download + play their video; off-screen
   * videos stay paused with preload="none", so the home page no longer pulls
   * every clip up front.
   */
  private playVisibleVideos(): void {
    const root = this.swiperRef.nativeElement;
    root.querySelectorAll<HTMLVideoElement>('.swiper-slide:not(.swiper-slide-visible) video').forEach(v => {
      if (!v.paused) v.pause();
    });
    root.querySelectorAll<HTMLVideoElement>('.swiper-slide-visible video').forEach(v => {
      v.muted = true;
      v.playsInline = true;
      const result = v.play();
      if (result && typeof result.catch === 'function') {
        result.catch(() => { /* autoplay policy — ignore */ });
      }
    });
  }
}
