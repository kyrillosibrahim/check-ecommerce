import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject, Input, OnDestroy, PLATFORM_ID, ViewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IBrand } from '../../../../core/models/brand.model';
import { CldImagePipe } from '../../../../shared/pipes/cld-image.pipe';
import Swiper from 'swiper';
import { Autoplay, Grid } from 'swiper/modules';

@Component({
  selector: 'app-brands-grid',
  imports: [RouterLink, CldImagePipe],
  templateUrl: './brands-grid.component.html',
  styleUrl: './brands-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandsGridComponent implements AfterViewInit, OnDestroy {
  @Input() brands: IBrand[] = [];
  @ViewChild('swiperRef') swiperRef!: ElementRef<HTMLElement>;

  private platformId = inject(PLATFORM_ID);
  private swiper?: Swiper;

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId) && this.brands.length > 0) {
      this.initSwiper();
    }
  }

  ngOnDestroy(): void {
    this.swiper?.destroy(true, true);
  }

  private initSwiper() {
    this.swiper = new Swiper(this.swiperRef.nativeElement, {
      modules: [Autoplay, Grid],
      slidesPerView: 3.3,
      slidesPerGroup: 1,
      spaceBetween: 12,
      grabCursor: true,
      speed: 600,
      grid: { rows: 2, fill: 'row' },
      autoplay: {
        delay: 2500,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
      breakpoints: {
        576: { slidesPerView: 3.3, grid: { rows: 2, fill: 'row' }, spaceBetween: 12 },
        768: { slidesPerView: 4.3, grid: { rows: 2, fill: 'row' }, spaceBetween: 14 },
        992: { slidesPerView: 5.3, grid: { rows: 2, fill: 'row' }, spaceBetween: 14 },
        1200: { slidesPerView: 6.3, grid: { rows: 2, fill: 'row' }, spaceBetween: 16 },
      },
    });
  }
}
