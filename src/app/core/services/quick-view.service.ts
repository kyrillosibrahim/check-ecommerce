import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class QuickViewService {
  private productSubject = new BehaviorSubject<any | null>(null);
  product$ = this.productSubject.asObservable();

  open(product: any): void {
    this.productSubject.next(product);
    document.body.style.overflow = 'hidden';
  }

  close(): void {
    this.productSubject.next(null);
    document.body.style.overflow = '';
  }
}
