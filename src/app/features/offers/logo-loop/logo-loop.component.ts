import {
  Component,
  Input,
  OnInit,
  ChangeDetectionStrategy,
  ViewEncapsulation,
} from '@angular/core';

@Component({
  selector: 'app-logo-loop',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="logo-marquee" [class.logo-marquee--fade]="fadeOut">
      <div
        class="logo-marquee__track"
        [style.animation-duration]="speed + 's'"
      >
        <div class="logo-marquee__set">
          @for (img of items; track $index) {
            <img
              [src]="img.src"
              [alt]="img.alt"
              [style.height.px]="logoHeight"
              [style.margin-inline-end.px]="gap"
            />
          }
        </div>
        <div class="logo-marquee__set" aria-hidden="true">
          @for (img of items; track $index) {
            <img
              [src]="img.src"
              [alt]="img.alt"
              [style.height.px]="logoHeight"
              [style.margin-inline-end.px]="gap"
            />
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .logo-marquee {
      overflow: hidden;
      width: 100%;
      padding: 0.75rem 0;
      position: relative;
    }

    .logo-marquee__track {
      display: flex;
      width: max-content;
      animation: logoMarqueeScroll linear infinite;
      will-change: transform;
    }

    .logo-marquee__set {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .logo-marquee__set img {
      width: auto;
      display: block;
      object-fit: contain;
      flex-shrink: 0;
      filter: drop-shadow(0 2px 8px rgba(0,0,0,0.12));
      pointer-events: none;
    }

    .logo-marquee:hover .logo-marquee__track {
      animation-play-state: paused;
    }

    @keyframes logoMarqueeScroll {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    .logo-marquee--fade::before,
    .logo-marquee--fade::after {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      width: 60px;
      z-index: 2;
      pointer-events: none;
    }

    .logo-marquee--fade::before {
      left: 0;
      background: linear-gradient(to right, var(--bs-body-bg, #fff), transparent);
    }

    .logo-marquee--fade::after {
      right: 0;
      background: linear-gradient(to left, var(--bs-body-bg, #fff), transparent);
    }

    @media (max-width: 576px) {
      .logo-marquee__set img {
        height: 55px !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoLoopComponent implements OnInit {
  @Input() images: { src: string; alt: string }[] = [];
  @Input() speed = 30;
  @Input() logoHeight = 80;
  @Input() gap = 40;
  @Input() fadeOut = false;

  items: { src: string; alt: string }[] = [];

  ngOnInit(): void {
    if (!this.images.length) return;
    // Build once, never recalculate
    for (let i = 0; i < 10; i++) {
      this.items.push(...this.images);
    }
  }
}
