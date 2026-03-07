import { Component, inject, AfterViewInit, ElementRef } from '@angular/core';
import { SLIDES_DATA, ISlide } from '../../data/slides.data';
import { TranslationService } from '../../../../core/services/translation.service';

declare var bootstrap: any;

@Component({
  selector: 'app-hero-slider',
  imports: [],
  templateUrl: './hero-slider.component.html',
  styleUrl: './hero-slider.component.scss'
})
export class HeroSliderComponent implements AfterViewInit {
  private translationService = inject(TranslationService);
  private el = inject(ElementRef);
  slides: ISlide[] = SLIDES_DATA;

  get translatedSlides() {
    return this.slides.map((slide, i) => ({
      ...slide,
      title: this.translationService.translate(`hero.slide${i + 1}_title`),
      subtitle: this.translationService.translate(`hero.slide${i + 1}_subtitle`),
      ctaText: this.translationService.translate(`hero.slide${i + 1}_cta`),
    }));
  }

  ngAfterViewInit(): void {
    const carouselEl = this.el.nativeElement.querySelector('#heroCarousel');
    if (carouselEl && typeof bootstrap !== 'undefined') {
      new bootstrap.Carousel(carouselEl, { interval: 3500, ride: 'carousel' });
    }
  }
}
