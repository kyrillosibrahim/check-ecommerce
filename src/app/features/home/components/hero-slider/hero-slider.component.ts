import { ChangeDetectionStrategy, Component, inject, AfterViewInit, ElementRef, input, OnChanges } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { IBanner } from '../../../../core/models/banner.model';

declare var bootstrap: any;

@Component({
  selector: 'app-hero-slider',
  imports: [NgOptimizedImage],
  templateUrl: './hero-slider.component.html',
  styleUrl: './hero-slider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSliderComponent implements AfterViewInit, OnChanges {
  private el = inject(ElementRef);
  private router = inject(Router);

  banners = input<IBanner[]>([]);
  loading = input(true);

  ngAfterViewInit(): void {
    this.initCarousel();
  }

  ngOnChanges(): void {
    setTimeout(() => this.initCarousel(), 100);
  }

  navigateTo(link: string): void {
    this.router.navigateByUrl(link);
  }

  private initCarousel(): void {
    const carouselEl = this.el.nativeElement.querySelector('#heroCarousel');
    if (carouselEl && typeof bootstrap !== 'undefined') {
      new bootstrap.Carousel(carouselEl, { interval: 3500, ride: 'carousel' });
    }
  }
}
