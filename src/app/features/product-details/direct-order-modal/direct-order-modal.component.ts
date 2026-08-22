import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, inject, Input, NgZone, OnInit, Output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { GovernorateService } from '../../../core/services/governorate.service';
import { IGovernorateApi, ICityApi } from '../../../core/models/governorate.model';
import { IProduct } from '../../../core/models/product.model';
import { IAddress } from '../../../core/models/user.model';
import { API_CONFIG } from '../../../core/config/api.config';
import { unitPriceAfterDiscount } from '../../../core/utils/pricing.util';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-direct-order-modal',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './direct-order-modal.component.html',
  styleUrl: './direct-order-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DirectOrderModalComponent implements OnInit {
  @Input({ required: true }) product!: IProduct;
  @Input() quantity = 1;
  @Output() closed = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private governorateService = inject(GovernorateService);

  governorates: IGovernorateApi[] = [];
  cities: ICityApi[] = [];
  selectedGov: IGovernorateApi | null = null;

  locating = signal(false);
  submitting = signal(false);
  paymentMethod = signal<'cod' | 'instapay'>('cod');

  form = this.fb.group({
    name: ['', Validators.required],
    phone: ['', [Validators.required, Validators.minLength(11)]],
    altPhone: [''],
    governorate: ['', Validators.required],
    city: ['', Validators.required],
    address: ['', Validators.required],
  });

  ngOnInit(): void {
    this.governorateService.getGovernorates().subscribe(govs => {
      this.governorates = govs;
      this.cdr.markForCheck();
    });
  }

  close(): void { this.closed.emit(); }

  selectPayment(method: 'cod' | 'instapay'): void { this.paymentMethod.set(method); }

  get unitPrice(): number {
    return unitPriceAfterDiscount(this.product);
  }

  get subtotal(): number {
    return this.unitPrice * this.quantity;
  }

  get shippingCost(): number {
    if (!this.selectedGov) return 0;
    const base = this.selectedGov.shippingCost || 0;
    const extra = this.selectedGov.extraShippingCost || 0;
    const tiers = Math.floor(this.quantity / 5);
    const raw = base + tiers * extra;
    // 50% shipping discount when paying via INSTAPAY
    return this.paymentMethod() === 'instapay' ? Math.round(raw * 0.5) : raw;
  }

  get total(): number {
    return this.subtotal + this.shippingCost;
  }

  onGovernorateChange(): void {
    const govName = this.form.get('governorate')!.value;
    this.selectedGov = this.governorates.find(g => g.governorate_name_en === govName) || null;
    this.form.patchValue({ city: '' });
    this.cities = [];
    if (this.selectedGov) {
      this.governorateService.getCities(this.selectedGov.id).subscribe(cities => {
        this.cities = cities;
        this.cdr.markForCheck();
      });
    }
  }

  // ── GPS / Reverse geocoding ──
  private normalizeName(s: string): string {
    return (s || '').toLowerCase()
      .replace(/\s*governorate\s*/g, '').replace(/\s*محافظة\s*/g, '')
      .replace(/^(al-|al\s|el-|el\s|ال)/, '')
      .replace(/[^a-z0-9\u0600-\u06FF]/g, '').trim();
  }

  private fuzzyMatch(a: string, b: string): boolean {
    if (!a || !b) return false;
    const n = this.normalizeName(a), h = this.normalizeName(b);
    return !!n && !!h && (n === h || n.includes(h) || h.includes(n));
  }

  useCurrentLocation(): void {
    if (!navigator.geolocation) return;
    this.locating.set(true);
    this.cdr.markForCheck();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.ngZone.run(() => {
          const { latitude, longitude } = pos.coords;
          const urlAr = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ar`;
          const urlEn = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`;
          this.http.get<any>(urlAr).subscribe({
            next: (dataAr) => this.http.get<any>(urlEn).subscribe({
              next: (dataEn) => this.applyLocationData(dataAr, dataEn),
              error: () => this.applyLocationData(dataAr, dataAr),
            }),
            error: () => { this.locating.set(false); this.cdr.markForCheck(); },
          });
        });
      },
      () => {
        this.ngZone.run(() => {
          this.locating.set(false);
          Swal.fire({ icon: 'warning', title: 'تنبيه', text: 'تعذر الوصول لموقعك. تأكد من منح صلاحية الموقع', confirmButtonText: 'حسنًا', confirmButtonColor: 'var(--sz-accent)' });
        });
      },
      { timeout: 8000 }
    );
  }

  private applyLocationData(dataAr: any, dataEn: any): void {
    const aAr = dataAr.address || {};
    const aEn = dataEn.address || {};
    const parts = [aAr.road, aAr.neighbourhood, aAr.suburb, aAr.village].filter(Boolean);
    const fallback = [aEn.road, aEn.neighbourhood, aEn.suburb, aEn.village].filter(Boolean);
    this.form.patchValue({ address: parts.join('، ') || fallback.join(', ') || '' });

    const stateAr = aAr.state || aAr.county || '';
    const stateEn = aEn.state || aEn.county || '';
    const matched = this.governorates.find(g =>
      this.fuzzyMatch(stateAr, g.governorate_name_ar) ||
      this.fuzzyMatch(stateEn, g.governorate_name_en) ||
      this.fuzzyMatch(stateAr, g.governorate_name_en) ||
      this.fuzzyMatch(stateEn, g.governorate_name_ar)
    );

    if (matched) {
      this.form.patchValue({ governorate: matched.governorate_name_en, city: '' });
      this.selectedGov = matched;
      this.cities = [];
      const cityAr = aAr.city || aAr.town || aAr.municipality || aAr.village || '';
      const cityEn = aEn.city || aEn.town || aEn.municipality || aEn.village || '';
      this.governorateService.getCities(matched.id).subscribe(cities => {
        this.cities = cities;
        const matchedCity = cities.find(c =>
          this.fuzzyMatch(cityAr, c.city_name_ar) ||
          this.fuzzyMatch(cityEn, c.city_name_en) ||
          this.fuzzyMatch(cityAr, c.city_name_en) ||
          this.fuzzyMatch(cityEn, c.city_name_ar)
        );
        if (matchedCity) this.form.patchValue({ city: matchedCity.city_name_en });
        this.locating.set(false);
        this.cdr.markForCheck();
      });
    } else {
      this.locating.set(false);
      this.cdr.markForCheck();
    }
  }

  // ── Submit: register → save address → add to cart → place order ──
  placeOrder(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const { name, phone, altPhone, governorate, city, address } = this.form.value;

    this.authService.register(name!, phone!).subscribe({
      next: () => {
        const shippingAddress: IAddress = { fullName: name!, phone: phone!, governorate: governorate!, city: city!, address: address! };
        this.authService.saveAddress(shippingAddress).subscribe();
        this.cartService.addToCart(this.product, this.quantity);

        const orderId = 'ORD-' + Date.now().toString(36).toUpperCase();
        const unitPrice = this.unitPrice;
        const orderPayload = {
          id: orderId,
          items: [{
            productId: this.product.id,
            title: this.product.title,
            titleAr: this.product.titleAr || this.product.title,
            image: this.product.images?.[0] || '',
            merchant: this.product.merchant || '',
            quantity: this.quantity,
            price: unitPrice,
            total: unitPrice * this.quantity,
          }],
          total: this.total,
          subtotal: this.subtotal,
          discount: 0,
          shippingCost: this.shippingCost,
          shippingAddress,
          shippingCompany: 'J&T Express',
          paymentMethod: this.paymentMethod(),
          paymentStatus: 'unpaid',
          notes: altPhone ? `رقم بديل: ${altPhone}` : '',
          customer: { name: name!, phone: phone!, email: '' },
          date: new Date().toISOString(),
          status: 'pending',
        };

        this.http.post(API_CONFIG.ordersUrl, orderPayload).subscribe({
          next: () => {
            this.submitting.set(false);
            this.cdr.markForCheck();
            Swal.fire({
              icon: 'success', title: 'تم استلام طلبك بنجاح',
              text: 'سنتواصل معك في أقرب وقت لتأكيد الطلب',
              confirmButtonText: 'حسنًا', confirmButtonColor: 'var(--sz-accent)',
            }).then(() => this.success.emit());
          },
          error: () => {
            this.submitting.set(false);
            this.cdr.markForCheck();
            Swal.fire({ icon: 'error', title: 'خطأ', text: 'حدث خطأ أثناء إرسال الطلب', confirmButtonText: 'حسنًا', confirmButtonColor: 'var(--sz-accent)' });
          },
        });
      },
      error: (err) => {
        this.submitting.set(false);
        this.cdr.markForCheck();
        const status = err?.status;
        if (status === 409) {
          Swal.fire({
            icon: 'info', title: 'الرقم مسجل بالفعل',
            text: 'هذا الرقم مسجل في حسابنا. سجل دخول لإتمام الطلب',
            confirmButtonText: 'حسنًا', confirmButtonColor: 'var(--sz-accent)',
          });
        } else {
          Swal.fire({
            icon: 'error', title: 'خطأ', text: err?.error?.error || 'حدث خطأ أثناء التسجيل',
            confirmButtonText: 'حسنًا', confirmButtonColor: 'var(--sz-accent)',
          });
        }
      },
    });
  }
}
