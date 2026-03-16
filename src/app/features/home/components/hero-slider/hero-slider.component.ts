import { ChangeDetectionStrategy, Component, inject, AfterViewInit, ElementRef, input, OnChanges } from '@angular/core';
import { Router } from '@angular/router';
import { SLIDES_DATA, ISlide } from '../../data/slides.data';
import { TranslationService } from '../../../../core/services/translation.service';
import { IBanner } from '../../../../core/models/banner.model';

declare var bootstrap: any;

@Component({
  selector: 'app-hero-slider',
  templateUrl: './hero-slider.component.html',
  styleUrl: './hero-slider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSliderComponent implements AfterViewInit, OnChanges {
  private translationService = inject(TranslationService);
  private el = inject(ElementRef);
  private router = inject(Router);

  banners = input<IBanner[]>([]);

  slides: ISlide[] = SLIDES_DATA;
  translatedSlides = this.slides.map((slide, i) => ({
    ...slide,
    title: this.translationService.translate(`hero.slide${i + 1}_title`),
    subtitle: this.translationService.translate(`hero.slide${i + 1}_subtitle`),
    ctaText: this.translationService.translate(`hero.slide${i + 1}_cta`),
  }));

  get useBanners(): boolean {
    return this.banners().length > 0;
  }

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
