import {
 ChangeDetectionStrategy, Component, Input, ViewChild,
 ElementRef, AfterViewInit, OnChanges, SimpleChanges,
 inject, PLATFORM_ID, ChangeDetectorRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ICategory } from '../../../../core/models/category.model';
import { CldImagePipe } from '../../../../shared/pipes/cld-image.pipe';
import Swiper from 'swiper';

@Component({
  selector: 'app-categories-grid',
  imports: [RouterLink, CldImagePipe],
  templateUrl: './categories-grid.component.html',
  styleUrl: './categories-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesGridComponent implements AfterViewInit, OnChanges {
  @Input({ required: true }) categories: ICategory[] = [];
  @ViewChild('swiperRef') swiperRef!: ElementRef<HTMLElement>;
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private swiper: Swiper | null = null;
  private viewReady = false;

  ngAfterViewInit() {
    this.viewReady = true;
    this.initSwiper();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['categories'] && this.viewReady) {
      this.cdr.detectChanges();
      requestAnimationFrame(() => this.initSwiper());
    }
  }

  slidePrev() { this.swiper?.slidePrev(); }
  slideNext() { this.swiper?.slideNext(); }

  private initSwiper() {
    if (!isPlatformBrowser(this.platformId) || this.categories.length === 0) return;
    if (this.swiper) {
      this.swiper.destroy(true, true);
    }
    this.swiper = new Swiper(this.swiperRef.nativeElement, {
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
