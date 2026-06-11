import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subscription, of, timer } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { API_CONFIG } from '../config/api.config';
import { AuthService } from './auth.service';
import { AlertService } from './alert.service';
import { INotification } from '../models/notification.model';

const POLL_INTERVAL = 30_000;

interface MineResponse { notifications: INotification[]; unreadCount: number; }

/**
 * Polls the customer's notification feed every ~30s while logged in. When a new
 * notification appears it pops a 5-second toast and bumps the unread badge.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private alert = inject(AlertService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private notificationsSubject = new BehaviorSubject<INotification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  private pollSub?: Subscription;
  private seenIds = new Set<string>();
  private primed = false; // skip toasts for the very first load after login

  constructor() {
    if (!this.isBrowser) return;
    this.auth.currentUser$.subscribe(user => {
      if (user) this.start();
      else this.stop();
    });
  }

  private start(): void {
    if (this.pollSub) return;
    this.primed = false;
    this.seenIds.clear();
    this.pollSub = timer(0, POLL_INTERVAL)
      .pipe(
        switchMap(() =>
          this.http.get<MineResponse>(`${API_CONFIG.notificationsUrl}/mine`).pipe(catchError(() => of(null)))
        )
      )
      .subscribe(res => { if (res) this.handle(res); });
  }

  private stop(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
    this.seenIds.clear();
    this.primed = false;
  }

  private handle(res: MineResponse): void {
    const list = res.notifications || [];
    // Toast notifications that are new since the last poll (not on first load).
    if (this.primed) {
      const fresh = list.filter(n => !this.seenIds.has(n.id));
      for (const n of fresh) this.toast(n);
    }
    list.forEach(n => this.seenIds.add(n.id));
    this.primed = true;
    this.notificationsSubject.next(list);
    this.unreadCountSubject.next(res.unreadCount ?? list.filter(n => !n.read).length);
  }

  private toast(n: INotification): void {
    this.alert.toast({
      icon: n.type === 'order_shipped' ? 'success' : 'info',
      title: n.title || 'إشعار جديد',
      text: n.body,
      timer: 5000,
      timerProgressBar: true,
    });
  }

  /** Force an immediate refresh (e.g. after opening the notifications page). */
  refresh(): void {
    if (!this.isBrowser || !this.auth.isLoggedIn()) return;
    this.http.get<MineResponse>(`${API_CONFIG.notificationsUrl}/mine`).subscribe({
      next: res => this.handle(res),
      error: () => {},
    });
  }

  markAllRead(): void {
    if (!this.auth.isLoggedIn()) return;
    this.http.patch(`${API_CONFIG.notificationsUrl}/read`, {}).subscribe({ error: () => {} });
    this.notificationsSubject.next(this.notificationsSubject.getValue().map(n => ({ ...n, read: true })));
    this.unreadCountSubject.next(0);
  }

  remove(id: string): void {
    this.http.delete(`${API_CONFIG.notificationsUrl}/${id}`).subscribe({ error: () => {} });
    const list = this.notificationsSubject.getValue().filter(n => n.id !== id);
    this.notificationsSubject.next(list);
    this.unreadCountSubject.next(list.filter(n => !n.read).length);
    this.seenIds.delete(id);
  }
}
