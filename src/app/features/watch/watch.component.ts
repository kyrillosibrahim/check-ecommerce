import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, inject, OnDestroy, OnInit, PLATFORM_ID, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SiteSettingsService } from '../../core/services/settings.service';

interface IWatchItem {
  video: string;
  link?: string;
}

const VIDEO_EXT_RE = /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i;

@Component({
  selector: 'app-watch',
  standalone: true,
  imports: [],
  templateUrl: './watch.component.html',
  styleUrl: './watch.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WatchComponent implements OnInit, AfterViewInit, OnDestroy {
  private settingsService = inject(SiteSettingsService);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('feed') feedRef?: ElementRef<HTMLElement>;
  @ViewChildren('slideVideo') videos?: QueryList<ElementRef<HTMLVideoElement>>;

  items: IWatchItem[] = [];
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId) && window.innerWidth >= 992) {
      this.router.navigate(['/']);
      return;
    }
    this.settingsService.getSettings().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(settings => {
      this.items = (settings.naturalProducts || []).filter(i => i?.video && this.isVideo(i.video));
      this.cdr.markForCheck();
      queueMicrotask(() => this.setupObserver());
    });
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
          v.muted = true;
          v.playsInline = true;
          const r = v.play();
          if (r && typeof r.catch === 'function') r.catch(() => {});
        } else {
          v.pause();
        }
      });
    }, { threshold: [0, 0.7, 1] });
    this.videos.forEach(v => this.observer!.observe(v.nativeElement));
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
