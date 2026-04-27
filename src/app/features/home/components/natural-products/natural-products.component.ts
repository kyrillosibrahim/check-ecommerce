import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject, Input, OnChanges, PLATFORM_ID, SimpleChanges, ViewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import Swiper from 'swiper';
import { Autoplay } from 'swiper/modules';

export interface INaturalProductItem {
  video: string;
  link: string;
}

const VIDEO_EXT_RE = /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i;

@Component({
  selector: 'app-natural-products',
  imports: [],
  templateUrl: './natural-products.component.html',
  styleUrl: './natural-products.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NaturalProductsComponent implements AfterViewInit, OnChanges {
  @Input() items: INaturalProductItem[] = [];
  @ViewChild('swiperRef') swiperRef!: ElementRef<HTMLElement>;

  private platformId = inject(PLATFORM_ID);
  private swiper?: Swiper;

  isVideo(url: string): boolean {
    if (!url) return false;
    if (url.includes('/video/upload/')) return true;
    return VIDEO_EXT_RE.test(url);
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId) && this.items.length > 0) {
      this.initSwiper();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'] && this.swiperRef && isPlatformBrowser(this.platformId)) {
      this.swiper?.destroy(true, true);
      if (this.items.length > 0) this.initSwiper();
    }
  }

  private initSwiper(): void {
    this.swiper = new Swiper(this.swiperRef.nativeElement, {
      modules: [Autoplay],
      slidesPerView: 1,
      spaceBetween: 12,
      loop: this.items.length > 2,
      grabCursor: true,
      speed: 600,
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
        afterInit: () => this.playAllVideos(),
        slideChangeTransitionEnd: () => this.playAllVideos(),
      },
    });
    setTimeout(() => this.playAllVideos(), 200);
  }

  private playAllVideos(): void {
    const videos = this.swiperRef.nativeElement.querySelectorAll('video');
    videos.forEach(v => {
      v.muted = true;
      v.playsInline = true;
      const result = v.play();
      if (result && typeof result.catch === 'function') {
        result.catch(() => { /* autoplay policy — ignore */ });
      }
    });
  }
}
