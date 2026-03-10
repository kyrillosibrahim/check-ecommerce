import {
  ChangeDetectionStrategy,
  Component,
  Input,
  signal,
  computed,
  OnDestroy,
  OnChanges,
} from '@angular/core';

export interface CarouselItem {
  image: string;
  title?: string;
  description?: string;
  id?: string | number;
}

const GAP = 16;
const DRAG_BUFFER = 20;
const VELOCITY_THRESHOLD = 500;

@Component({
  selector: 'app-carousel',
  imports: [],
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarouselComponent implements OnChanges, OnDestroy {
  @Input() items: CarouselItem[] = [];
  @Input() baseWidth = 300;
  @Input() autoplay = false;
  @Input() autoplayDelay = 3000;
  @Input() pauseOnHover = false;
  @Input() loop = false;

  private readonly containerPadding = 16;
  private autoplayTimer: ReturnType<typeof setInterval> | null = null;

  // Drag state
  private isDragging = false;
  private dragStartX = 0;
  private dragStartTime = 0;
  dragOffsetX = 0;

  position = signal(0);

  itemWidth = computed(() => this.baseWidth - this.containerPadding * 2);
  trackItemOffset = computed(() => this.itemWidth() + GAP);

  activeIndex = computed(() => {
    if (this.items.length === 0) return 0;
    return Math.min(this.position(), this.items.length - 1);
  });

  /** Track translateX - moves items so current one is in view */
  trackTransform = computed(() => {
    const offset = -(this.position() * this.trackItemOffset()) + this.dragOffsetX;
    return `translateX(${offset}px)`;
  });

  /** Perspective origin follows the current item center */
  perspectiveOrigin = computed(() => {
    const x = this.position() * this.trackItemOffset() + this.itemWidth() / 2;
    return `${x}px 50%`;
  });

  /**
   * Matches React useTransform mapping:
   *  range:  [-(i+1)*tio, -i*tio, -(i-1)*tio]
   *  output: [90,         0,      -90]
   *
   * Items to the LEFT of current get positive rotateY (face right).
   * Items to the RIGHT get negative rotateY (face left).
   */
  getItemRotateY(index: number): number {
    const currentX = -(this.position() * this.trackItemOffset()) + this.dragOffsetX;
    const itemCenter = index * this.trackItemOffset();
    const viewCenter = -currentX;
    const offset = (viewCenter - itemCenter) / this.trackItemOffset();
    return offset * 90;
  }

  getItemTransform(index: number): string {
    return `rotateY(${this.getItemRotateY(index)}deg)`;
  }

  getItemOpacity(index: number): number {
    const absRotate = Math.abs(this.getItemRotateY(index));
    if (absRotate >= 90) return 0;
    return 1 - absRotate / 90;
  }

  ngOnChanges(): void {
    this.position.set(0);
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  goTo(index: number): void {
    this.position.set(index);
  }

  // ── Drag ──

  onPointerDown(event: PointerEvent): void {
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragOffsetX = 0;
    this.dragStartTime = Date.now();
    this.stopAutoplay();
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.isDragging) return;
    this.dragOffsetX = event.clientX - this.dragStartX;
  }

  onPointerUp(): void {
    if (!this.isDragging) return;
    this.isDragging = false;

    const elapsed = Date.now() - this.dragStartTime;
    const velocity = elapsed > 0 ? (this.dragOffsetX / elapsed) * 1000 : 0;

    let direction = 0;
    if (this.dragOffsetX < -DRAG_BUFFER || velocity < -VELOCITY_THRESHOLD) {
      direction = 1;
    } else if (this.dragOffsetX > DRAG_BUFFER || velocity > VELOCITY_THRESHOLD) {
      direction = -1;
    }

    if (direction !== 0) {
      const next = this.position() + direction;
      const max = this.items.length - 1;
      if (this.loop) {
        this.position.set(((next % this.items.length) + this.items.length) % this.items.length);
      } else {
        this.position.set(Math.max(0, Math.min(next, max)));
      }
    }

    this.dragOffsetX = 0;
    this.startAutoplay();
  }

  // ── Hover ──

  onMouseEnter(): void {
    if (this.pauseOnHover) this.stopAutoplay();
  }

  onMouseLeave(): void {
    if (this.pauseOnHover) this.startAutoplay();
  }

  // ── Autoplay ──

  private startAutoplay(): void {
    if (!this.autoplay || this.items.length <= 1) return;
    this.stopAutoplay();
    this.autoplayTimer = setInterval(() => {
      const next = this.position() + 1;
      if (this.loop) {
        this.position.set(next % this.items.length);
      } else {
        this.position.set(Math.min(next, this.items.length - 1));
      }
    }, this.autoplayDelay);
  }

  private stopAutoplay(): void {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }
}
