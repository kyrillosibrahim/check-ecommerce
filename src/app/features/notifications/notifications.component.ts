import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { AsyncPipe, DatePipe, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationsService } from '../../core/services/notifications.service';
import { AlertService } from '../../core/services/alert.service';
import { INotification } from '../../core/models/notification.model';

@Component({
  selector: 'app-notifications',
  imports: [AsyncPipe, DatePipe],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private service = inject(NotificationsService);
  private alert = inject(AlertService);
  private router = inject(Router);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  notifications$ = this.service.notifications$;

  /** Ticks every second so coupon countdowns re-render. */
  now = signal(Date.now());
  private ticker?: any;

  ngOnInit(): void {
    this.service.refresh();
    // Mark everything read once the page is opened.
    this.service.markAllRead();
    if (this.isBrowser) {
      this.ticker = setInterval(() => this.now.set(Date.now()), 1000);
    }
  }

  ngOnDestroy(): void {
    if (this.ticker) clearInterval(this.ticker);
  }

  /** Remaining time for a coupon as "HH:MM:SS", or null when expired. */
  countdown(n: INotification): string | null {
    if (!n.coupon?.expiresAt) return null;
    const diff = new Date(n.coupon.expiresAt).getTime() - this.now();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1000);
    const pad = (x: number) => x.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  copyCode(code: string): void {
    if (this.isBrowser && navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() =>
        this.alert.toast({ icon: 'success', title: 'تم نسخ الكود', timer: 1500 })
      );
    }
  }

  open(n: INotification): void {
    const link = n.link;
    if (!link || link === '/notifications') return;
    if (/^https?:\/\//.test(link)) {
      window.open(link, '_blank');
    } else {
      this.router.navigateByUrl(link);
    }
  }

  remove(n: INotification, event: Event): void {
    event.stopPropagation();
    this.service.remove(n.id);
  }

  iconFor(type: string): string {
    switch (type) {
      case 'order_shipped': return 'bi-truck';
      case 'order_created': return 'bi-bag-check';
      case 'coupon': return 'bi-ticket-perforated';
      case 'welcome': return 'bi-emoji-smile';
      default: return 'bi-bell';
    }
  }
}
