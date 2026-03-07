import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AuthDrawerView = 'login' | 'register' | 'forgot-password';

@Injectable({ providedIn: 'root' })
export class AuthDrawerService {
  private isOpenSubject = new BehaviorSubject<boolean>(false);
  private activeViewSubject = new BehaviorSubject<AuthDrawerView>('login');
  private pendingUrl: string | null = null;

  isOpen$ = this.isOpenSubject.asObservable();
  activeView$ = this.activeViewSubject.asObservable();

  open(view: AuthDrawerView = 'login', pendingUrl?: string): void {
    this.pendingUrl = pendingUrl || null;
    this.activeViewSubject.next(view);
    this.isOpenSubject.next(true);
    document.body.style.overflow = 'hidden';
  }

  close(): void {
    this.isOpenSubject.next(false);
    document.body.style.overflow = '';
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
