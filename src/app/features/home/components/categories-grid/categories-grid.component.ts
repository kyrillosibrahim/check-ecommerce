import { ChangeDetectionStrategy, Component, Input, ViewChild, ElementRef, AfterViewInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ICategory } from '../../../../core/models/category.model';
import Swiper from 'swiper';

@Component({
  selector: 'app-categories-grid',
  imports: [RouterLink],
  templateUrl: './categories-grid.component.html',
  styleUrl: './categories-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesGridComponent implements AfterViewInit {
  @Input({ required: true }) categories: ICategory[] = [];
  @ViewChild('swiperRef') swiperRef!: ElementRef<HTMLElement>;
  private platformId = inject(PLATFORM_ID);

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId) && this.categories.length > 0) {
      new Swiper(this.swiperRef.nativeElement, {
        slidesPerView: 3,
        spaceBetween: 10,
        grabCursor: true,
        breakpoints: {
          576: { slidesPerView: 4, spaceBetween: 10 },
          768: { slidesPerView: 6, spaceBetween: 12 },
          992: { slidesPerView: 8, spaceBetween: 12 },
          1200: { slidesPerView: 10, spaceBetween: 14 },
        },
      });
    }
  }
}
