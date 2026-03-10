import { ChangeDetectionStrategy, Component, Input, OnInit, OnDestroy, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-text-loop',
  imports: [],
  template: `
    @if (items.length > 0) {
      <div class="text-loop-container" [class.text-loop-sm]="size === 'sm'">
        <div class="text-loop-track" [class.sliding]="sliding()">
          <!-- Current item -->
          <div class="text-loop-item">
            @if (currentItem().image) {
              <img [src]="currentItem().image" [alt]="currentText()" class="text-loop-img">
            }
            @if (currentText()) {
              <span class="text-loop-text">{{ currentText() }}</span>
            }
          </div>
          <!-- Next item (slides up from below) -->
          <div class="text-loop-item">
            @if (nextItem().image) {
              <img [src]="nextItem().image" [alt]="nextText()" class="text-loop-img">
            }
            @if (nextText()) {
              <span class="text-loop-text">{{ nextText() }}</span>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: inline-block; margin-bottom: 0.5rem; }
    .text-loop-container {
      position: relative;
      align-items: center;
      max-height: 32px;
      overflow: hidden;
    }
    .text-loop-sm {
      height: 26px;
      max-height: 26px;
      padding: 3px 8px;
      border-radius: 4px;
    }
    .text-loop-track {
      display: flex;
      flex-direction: column;
      transform: translateY(0);
    }
    .text-loop-track.sliding {
      transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
      transform: translateY(-50%);
    }
    .text-loop-item {
      display: flex;
      align-items: center;
      gap: 6px;
      height: 32px;
      flex-shrink: 0;
    }
    .text-loop-sm .text-loop-item {
      height: 24px;
    }
    .text-loop-img {
      height: 20px;
      width: auto;
      border-radius: 3px;
      object-fit: contain;
    }
    .text-loop-sm .text-loop-img {
      height: 16px;
    }
    .text-loop-text {
      font-size: 0.78rem;
      font-weight: 600;
      color: #e74c3c;
      white-space: nowrap;
    }
    .text-loop-sm .text-loop-text {
      font-size: 0.68rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextLoopComponent implements OnInit, OnDestroy {
  @Input() items: { text: string; textAr?: string; image?: string }[] = [];
  @Input() interval = 3000;
  @Input() size: 'sm' | 'md' = 'md';

  private translationService = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);
  private timerId: any;

  currentIndex = signal(0);
  sliding = signal(false);

  currentItem = computed(() => this.items[this.currentIndex()] || { text: '' });
  nextItem = computed(() => {
    const nextIdx = (this.currentIndex() + 1) % this.items.length;
    return this.items[nextIdx] || { text: '' };
  });

  currentText = computed(() => {
    const item = this.currentItem();
    if (this.translationService.currentLang() === 'ar' && item.textAr) {
      return item.textAr;
    }
    return item.text;
  });

  nextText = computed(() => {
    const item = this.nextItem();
    if (this.translationService.currentLang() === 'ar' && item.textAr) {
      return item.textAr;
    }
    return item.text;
  });

  ngOnInit(): void {
    if (this.items.length > 1) {
      this.timerId = setInterval(() => this.cycle(), this.interval);
    }
  }

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
  }

  private cycle(): void {
    // Start slide-up animation
    this.sliding.set(true);
    this.cdr.markForCheck();

    // After animation completes, snap back and advance index
    setTimeout(() => {
      this.sliding.set(false);
      this.currentIndex.set((this.currentIndex() + 1) % this.items.length);
      this.cdr.markForCheck();
    }, 450);
  }
}
