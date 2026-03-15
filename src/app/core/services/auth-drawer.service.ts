import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export type AuthDrawerView = 'login' | 'register' | 'forgot-password';

@Injectable({ providedIn: 'root' })
export class AuthDrawerService {
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private isOpenSubject = new BehaviorSubject<boolean>(false);
  private activeViewSubject = new BehaviorSubject<AuthDrawerView>('login');
  private pendingUrl: string | null = null;

  isOpen$ = this.isOpenSubject.asObservable();
  activeView$ = this.activeViewSubject.asObservable();

  open(view: AuthDrawerView = 'login', pendingUrl?: string): void {
    this.pendingUrl = pendingUrl || null;
    this.activeViewSubject.next(view);
    this.isOpenSubject.next(true);
    if (this.isBrowser) document.body.style.overflow = 'hidden';
  }

  close(): void {
    this.isOpenSubject.next(false);
    if (this.isBrowser) document.body.style.overflow = '';
  }

  switchView(view: AuthDrawerView): void {
    this.activeViewSubject.next(view);
  }

  isOpen(): boolean {
    return this.isOpenSubject.getValue();
  }

  getPendingUrl(): string | null {
    const url = this.pendingUrl;
    this.pendingUrl = null;
    return url;
  }
}
