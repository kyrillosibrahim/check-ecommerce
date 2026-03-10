import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';

@Component({
  selector: 'app-image-gallery',
  templateUrl: './image-gallery.component.html',
  styleUrl: './image-gallery.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageGalleryComponent {
  @Input({ required: true }) images: string[] = [];
  @Input() productTitle = '';

  selectedIndex = signal(0);

  get selectedImage(): string {
    return this.images[this.selectedIndex()] ?? '';
  }

  selectImage(index: number): void {
    this.selectedIndex.set(index);
  }
}
