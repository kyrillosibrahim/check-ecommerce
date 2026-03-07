import { Directive, ElementRef, HostListener, inject } from '@angular/core';

/** Adds a subtle scale + shadow effect on hover */
@Directive({ selector: '[appHighlight]' })
export class HighlightDirective {
  private el = inject(ElementRef);

  @HostListener('mouseenter') onMouseEnter(): void {
    this.el.nativeElement.style.transform = 'translateY(-4px)';
    this.el.nativeElement.style.boxShadow = 'var(--sz-shadow-hover)';
    this.el.nativeElement.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
  }

  @HostListener('mouseleave') onMouseLeave(): void {
    this.el.nativeElement.style.transform = '';
    this.el.nativeElement.style.boxShadow = '';
  }
}
