import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, inject, Input, Output, PLATFORM_ID, ViewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IProduct } from '../../../../core/models/product.model';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import Swiper from 'swiper';
import { Autoplay } from 'swiper/modules';

@Component({
  selector: 'app-featured-products',
  imports: [ProductCardComponent, RouterLink, TranslatePipe],
  templateUrl: './featured-products.component.html',
  styleUrl: './featured-products.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedProductsComponent implements AfterViewInit {
  @Input({ required: true }) products: IProduct[] = [];
  @Output() addToCart = new EventEmitter<IProduct>();
  @Output() addToWishlist = new EventEmitter<IProduct>();
  @ViewChild('swiperRef') swiperRef!: ElementRef<HTMLElement>;

  private swiper!: Swiper;
  private platformId = inject(PLATFORM_ID);

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.swiper = new Swiper(this.swiperRef.nativeElement, {
        modules: [Autoplay],
        slidesPerView: 2.2,
        spaceBetween: 12,
        grabCursor: true,
        breakpoints: {
          576: { slidesPerView: 3.2, spaceBetween: 12 },
          768: { slidesPerView: 4.2, spaceBetween: 12 },
          992: { slidesPerView: 5.2, spaceBetween: 12 },
          1200: { slidesPerView: 6.2, spaceBetween: 12 },
        },
      });
    }
  }

  slidePrev() { this.swiper?.slidePrev(); }
  slideNext() { this.swiper?.slideNext(); }
}
