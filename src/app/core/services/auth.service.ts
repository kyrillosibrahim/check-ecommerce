import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { IUser, IAddress } from '../models/user.model';
import { API_CONFIG } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = API_CONFIG.authUrl;
  private readonly STORAGE_KEY = 'sz-current-user';
  private http = inject(HttpClient);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private currentUserSubject = new BehaviorSubject<IUser | null>(this.loadUser());

  currentUser$ = this.currentUserSubject.asObservable();
  isLoggedIn$ = this.currentUser$.pipe(map(user => !!user));
  isAdmin$ = this.currentUser$.pipe(map(user => user?.role === 'admin'));

  register(name: string, phone: string, password?: string, confirmPassword?: string): Observable<{ user: IUser; token: string }> {
    const body: { name: string; phone: string; password?: string; confirmPassword?: string } = { name, phone };
    if (password) { body.password = password; body.confirmPassword = confirmPassword; }
    return this.http.post<{ user: IUser; token: string }>(`${this.API}/register`, body).pipe(
      tap(res => this.setSession(res.user, res.token))
    );
  }

  login(phone: string, password: string): Observable<{ user: IUser; token: string }> {
    return this.http.post<{ user: IUser; token: string }>(`${this.API}/login`, {
      phone, password
    }).pipe(
      tap(res => this.setSession(res.user, res.token))
    );
  }

  forgotPassword(phone: string): Observable<{ message: string; otp: string; userName: string }> {
    return this.http.post<{ message: string; otp: string; userName: string }>(`${this.API}/forgot-password`, { phone });
  }

  resetPassword(phone: string, otp: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/reset-password`, { phone, otp, newPassword });
  }

  logout(): void {
    this.currentUserSubject.next(null);
    if (this.isBrowser) localStorage.removeItem(this.STORAGE_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.getValue();
  }

  isAdmin(): boolean {
    return this.currentUserSubject.getValue()?.role === 'admin';
  }

  getCurrentUser(): IUser | null {
    return this.currentUserSubject.getValue();
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not logged in');
    return this.http.put<{ message: string }>(`${this.API}/users/${user.id}/change-password`, { currentPassword, newPassword });
  }

  saveAddress(address: IAddress): Observable<IUser> {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not logged in');
    return this.http.put<IUser>(`${this.API}/users/${user.id}/address`, address).pipe(
      tap(updated => {
        const token = user.token;
        this.setSession({ ...updated }, token!);
      })
    );
  }

  private setSession(user: IUser, token: string): void {
    const userData = { ...user, token };
    this.currentUserSubject.next(userData);
    if (this.isBrowser) localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData));
  }

  private loadUser(): IUser | null {
    if (!this.isBrowser) return null;
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
}
