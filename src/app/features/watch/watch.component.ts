import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, inject, OnDestroy, OnInit, PLATFORM_ID, QueryList, signal, ViewChild, ViewChildren } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SiteSettingsService } from '../../core/services/settings.service';
import { ProductService } from '../../core/services/product.service';
import { IProduct } from '../../core/models/product.model';
import { unitPriceAfterDiscount } from '../../core/utils/pricing.util';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { CldImagePipe } from '../../shared/pipes/cld-image.pipe';
import { EgpCurrencyPipe } from '../../shared/pipes/egp-currency.pipe';
import { LocalizePipe } from '../../shared/pipes/localize.pipe';

interface IWatchItem {
  video: string;
  poster?: string;
  link?: string;
  /** Set when the link points to a product page — used to show the product card */
  productId?: string;
}

const VIDEO_EXT_RE = /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i;
const CLD_VIDEO_MARK = '/video/upload/';
const PRODUCT_LINK_RE = /\/product\/([^/?#]+)/;

@Component({
  selector: 'app-watch',
  standalone: true,
  imports: [TranslatePipe, CldImagePipe, EgpCurrencyPipe, LocalizePipe],
  templateUrl: './watch.component.html',
  styleUrl: './watch.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WatchComponent implements OnInit, AfterViewInit, OnDestroy {
  private settingsService = inject(SiteSettingsService);
  private productService = inject(ProductService);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('feed') feedRef?: ElementRef<HTMLElement>;
  @ViewChildren('slideVideo') videos?: QueryList<ElementRef<HTMLVideoElement>>;

  items: IWatchItem[] = [];
  /** Products linked from the videos, keyed by id (filled after one batch request) */
  products = signal<Map<string, IProduct>>(new Map());
  private observer?: IntersectionObserver;

  private readonly SOUND_KEY = 'kaf-watch-sound';
  /** Whether the feed is muted. Starts from the saved preference (sound on by default). */
  muted = signal(this.loadMutedPref());

  private loadMutedPref(): boolean {
    if (!isPlatformBrowser(this.platformId)) return true;
    // '0' means the user turned sound OFF (muted); default is sound ON.
    return localStorage.getItem(this.SOUND_KEY) === '0';
  }

  private saveMutedPref(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.SOUND_KEY, this.muted() ? '0' : '1');
    }
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId) && window.innerWidth >= 992) {
      this.router.navigate(['/']);
      return;
    }
    this.settingsService.getSettings().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(settings => {
      this.items = (settings.naturalProducts || [])
        .filter(i => i?.video && this.isVideo(i.video))
        .map(i => ({
          video: this.optimizeVideo(i.video),
          poster: this.posterFor(i.video),
          link: i.link,
          productId: i.link?.match(PRODUCT_LINK_RE)?.[1],
        }));
      this.cdr.markForCheck();
      queueMicrotask(() => this.setupObserver());
      this.loadProducts();
    });
  }

  /** One request for every product linked from the feed; on failure the videos just show without cards. */
  private loadProducts(): void {
    const ids = [...new Set(this.items.map(i => i.productId).filter((id): id is string => !!id))];
    if (!ids.length) return;
    this.productService.getByIds(ids).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: products => this.products.set(new Map(products.map(p => [p.id, p]))),
      error: () => {},
    });
  }

  productFor(item: IWatchItem): IProduct | undefined {
    return item.productId ? this.products().get(item.productId) : undefined;
  }

  priceOf(p: IProduct): number {
    return unitPriceAfterDiscount(p);
  }

  hasDiscount(p: IProduct): boolean {
    return this.priceOf(p) < p.price;
  }

  /** Add Cloudinary auto quality/format so videos download smaller & start faster. */
  private optimizeVideo(url: string): string {
    if (!url || !url.includes(CLD_VIDEO_MARK)) return url;
    return url.replace(CLD_VIDEO_MARK, `${CLD_VIDEO_MARK}q_auto,f_auto/`);
  }

  /** Build a poster (first frame) from the Cloudinary URL so no black screen while buffering. */
  private posterFor(url: string): string | undefined {
    if (!url || !url.includes(CLD_VIDEO_MARK)) return undefined;
    const withTx = url.replace(CLD_VIDEO_MARK, `${CLD_VIDEO_MARK}so_0,q_auto,f_auto,w_640/`);
    // Force a .jpg still — works whether or not the source URL carried a video extension.
    return VIDEO_EXT_RE.test(withTx)
      ? withTx.replace(/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i, '.jpg$2')
      : withTx.replace(/(\?.*)?$/, '.jpg$1');
  }

  ngAfterViewInit(): void {
    this.setupObserver();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  isVideo(url: string): boolean {
    if (!url) return false;
    if (url.includes('/video/upload/')) return true;
    return VIDEO_EXT_RE.test(url);
  }

  private setupObserver(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.videos || this.videos.length === 0) return;
    this.observer?.disconnect();
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const v = entry.target as HTMLVideoElement;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
          v.playsInline = true;
          v.muted = this.muted();
          this.preloadNext(v);
          const r = v.play();
          // Browsers block autoplay WITH sound — if that's why play() failed,
          // fall back to muted playback and reflect it in the toggle.
          if (r && typeof r.catch === 'function') {
            r.catch(() => {
              if (!v.muted) {
                v.muted = true;
                this.muted.set(true); // reflect in the toggle; don't persist an
                this.cdr.markForCheck(); // auto-fallback as the user's choice
                v.play().catch(() => {});
              }
            });
          }
        } else {
          v.pause();
        }
      });
    }, { threshold: [0, 0.7, 1] });
    this.videos.forEach(v => this.observer!.observe(v.nativeElement));

    // Start the first video right away instead of waiting for the observer to
    // fire — eager preload + immediate play so it opens the moment the tab loads.
    const first = this.videos.first?.nativeElement;
    if (first) {
      first.preload = 'auto';
      first.playsInline = true;
      first.muted = this.muted();
      first.play().catch(() => {
        if (!first.muted) {
          first.muted = true;
          this.muted.set(true);
          this.cdr.markForCheck();
          first.play().catch(() => {});
        }
      });
    }
  }

  /** Warm up the next slide's video while the current one plays, to avoid a buffering gap. */
  private preloadNext(current: HTMLVideoElement): void {
    if (!this.videos) return;
    const arr = this.videos.toArray();
    const idx = arr.findIndex(ref => ref.nativeElement === current);
    const next = arr[idx + 1]?.nativeElement;
    if (next && next.preload !== 'auto') {
      next.preload = 'auto';
      next.load();
    }
  }

  /** User taps the speaker — this gesture unlocks audio, so unmuting plays sound. */
  toggleSound(event: Event): void {
    event.stopPropagation();
    this.muted.update(m => !m);
    this.saveMutedPref();
    const isMuted = this.muted();
    this.videos?.forEach(ref => { ref.nativeElement.muted = isMuted; });
  }

  scrollBySlide(direction: 1 | -1): void {
    const el = this.feedRef?.nativeElement;
    if (!el) return;
    el.scrollBy({ top: direction * el.clientHeight, behavior: 'smooth' });
  }

  openLink(item: IWatchItem): void {
    if (!item?.link) return;
    if (/^https?:\/\//i.test(item.link)) {
      window.open(item.link, '_blank', 'noopener');
    } else {
      this.router.navigateByUrl(item.link);
    }
  }
}
