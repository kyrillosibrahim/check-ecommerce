import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IBrand } from '../../../../core/models/brand.model';
import Swiper from 'swiper';
import { Autoplay } from 'swiper/modules';

@Component({
  selector: 'app-brands-grid',
  imports: [RouterLink],
  templateUrl: './brands-grid.component.html',
  styleUrl: './brands-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandsGridComponent implements AfterViewInit {
  @Input() brands: IBrand[] = [];
  @ViewChild('swiperRef') swiperRef!: ElementRef<HTMLElement>;

  ngAfterViewInit() {
    if (this.brands.length > 0) {
      this.initSwiper();
    }
  }

  private initSwiper() {
    new Swiper(this.swiperRef.nativeElement, {
      modules: [Autoplay],
      slidesPerView: 2,
      slidesPerGroup: 1,
      spaceBetween: 0,
      loop: true,
      grabCursor: true,
      speed: 600,
      autoplay: {
        delay: 2000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
      breakpoints: {
        576: { slidesPerView: 3, spaceBetween: 0 },
        768: { slidesPerView: 4, spaceBetween: 0 },
        992: { slidesPerView: 5, spaceBetween: 0 },
        1200: { slidesPerView: 8, spaceBetween: 0 },
      },
    });
  }
}
