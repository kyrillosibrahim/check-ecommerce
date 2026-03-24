import { ChangeDetectionStrategy, Component, ElementRef, HostListener, Input, signal, ViewChild } from '@angular/core';

@Component({
  selector: 'app-image-gallery',
  templateUrl: './image-gallery.component.html',
  styleUrl: './image-gallery.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageGalleryComponent {
  @Input({ required: true }) images: string[] = [];
  @Input() productTitle = '';
  @ViewChild('mainWrapper') mainWrapper!: ElementRef<HTMLDivElement>;

  selectedIndex = signal(0);
  zoomScale = signal(1);
  translateX = signal(0);
  translateY = signal(0);
  isZoomed = signal(false);

  private readonly MIN_SCALE = 1;
  private readonly MAX_SCALE = 4;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartTranslateX = 0;
  private dragStartTranslateY = 0;

  get selectedImage(): string {
    return this.images[this.selectedIndex()] ?? '';
  }

  selectImage(index: number): void {
    this.selectedIndex.set(index);
    this.resetZoom();
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.2 : 0.2;
    const newScale = Math.min(this.MAX_SCALE, Math.max(this.MIN_SCALE, this.zoomScale() + delta));
    this.zoomScale.set(newScale);
    this.isZoomed.set(newScale > 1);
    if (newScale === 1) {
      this.translateX.set(0);
      this.translateY.set(0);
    }
  }

  onMouseDown(event: MouseEvent): void {
    if (this.zoomScale() <= 1) return;
    event.preventDefault();
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragStartTranslateX = this.translateX();
    this.dragStartTranslateY = this.translateY();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    this.translateX.set(this.dragStartTranslateX + (event.clientX - this.dragStartX));
    this.translateY.set(this.dragStartTranslateY + (event.clientY - this.dragStartY));
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.isDragging = false;
  }

  onDoubleClick(): void {
    this.resetZoom();
  }

  private resetZoom(): void {
    this.zoomScale.set(1);
    this.isZoomed.set(false);
    this.translateX.set(0);
    this.translateY.set(0);
  }
}
