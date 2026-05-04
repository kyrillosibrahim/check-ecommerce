import { ChangeDetectionStrategy, Component, inject, ChangeDetectorRef, signal, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AsyncPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import confetti from 'canvas-confetti';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { GovernorateService } from '../../core/services/governorate.service';
import { API_CONFIG } from '../../core/config/api.config';
import { IOrder, IAddress } from '../../core/models/user.model';
import { IGovernorateApi, ICityApi, IDistrictApi } from '../../core/models/governorate.model';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LocalizePipe } from '../../shared/pipes/localize.pipe';
import { TranslationService } from '../../core/services/translation.service';
import { EgpCurrencyPipe } from '../../shared/pipes/egp-currency.pipe';
import { TrustPanelComponent } from '../../shared/components/trust-panel/trust-panel.component';

const FAR_GOVERNORATES_EN = [
  'Red Sea',
  'Aswan',
  'Luxor',
  'Matrouh',
  'New Valley',
  'North Sinai',
  'South Sinai',
  'Asyut',
  'Sohag',
  'Qena',
  'Minya',
];

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, FormsModule, AsyncPipe, EgpCurrencyPipe, RouterLink, TranslatePipe, LocalizePipe, TrustPanelComponent],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent implements OnDestroy {
  translationService = inject(TranslationService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  cartService = inject(CartService);
  private authService = inject(AuthService);
  private governorateService = inject(GovernorateService);
  private http = inject(HttpClient);

  orderPlaced = false;
  orderId = '';
  countdown = signal(10);

  governorates: IGovernorateApi[] = [];
  selectedGovernorate: IGovernorateApi | null = null;
  cities: ICityApi[] = [];
  districts: IDistrictApi[] = [];
  shippingCost = 0;
  private currentItemsCount = 0;
  private cartCountSub?: { unsubscribe(): void };

  savedAddress: IAddress | null = null;
  savedGovAr = '';
  savedCityAr = '';
  savedDistrictAr = '';
  showForm = false;

  paymentMethod = signal<'cod' | 'instapay'>('cod');
  notes = '';

  deliveryFromLabel = signal('');
  deliveryToLabel = signal('');
  cutoffHours = signal(0);
  cutoffMinutes = signal(0);
  cutoffSeconds = signal(0);
  private cutoffTimer: ReturnType<typeof setInterval> | null = null;

  checkoutForm: FormGroup = this.fb.group({
    governorate: ['', [Validators.required]],
    city: ['', [Validators.required]],
    district: [''],
    address: ['', [Validators.required]],
  });

  constructor() {
    this.cartService.loadCart();
    this.loadGovernorates();
    this.startCutoffTimer();
    this.cartCountSub = this.cartService.cartCount$.subscribe(count => {
      this.currentItemsCount = count;
      this.shippingCost = this.computeShipping();
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    if (this.cutoffTimer) {
      clearInterval(this.cutoffTimer);
    }
    this.cartCountSub?.unsubscribe();
  }

  private computeShipping(): number {
    if (!this.selectedGovernorate) return 0;
    const base = this.selectedGovernorate.shippingCost || 0;
    const extra = this.selectedGovernorate.extraShippingCost || 0;
    const tiers = Math.floor(this.currentItemsCount / 5);
    return base + tiers * extra;
  }

  private loadGovernorates(): void {
    this.governorateService.getGovernorates().subscribe(govs => {
      this.governorates = govs;

      const user = this.authService.getCurrentUser();
      if (user) {
        if (user.addresses && user.addresses.length > 0) {
          this.savedAddress = user.addresses[user.addresses.length - 1];
          this.prefillFromAddress(this.savedAddress);
          this.showForm = false;
        } else {
          this.showForm = true;
        }
      } else {
        this.showForm = true;
      }

      this.cdr.markForCheck();
    });
  }

  private prefillFromAddress(addr: IAddress): void {
    this.checkoutForm.patchValue({
      governorate: addr.governorate,
      address: addr.address,
    });

    this.selectedGovernorate = this.governorates.find(
      g => g.governorate_name_en === addr.governorate
    ) || null;

    if (this.selectedGovernorate) {
      this.shippingCost = this.computeShipping();
      this.savedGovAr = this.selectedGovernorate.governorate_name_ar;
      this.updateDeliveryRange();
      this.governorateService.getCities(this.selectedGovernorate.id).subscribe(cities => {
        this.cities = cities;
        this.checkoutForm.patchValue({ city: addr.city });
        const matchedCity = cities.find(c => c.city_name_en === addr.city);
        this.savedCityAr = matchedCity?.city_name_ar || addr.city;
        this.districts = matchedCity?.districts || [];
        if (addr.district) {
          this.checkoutForm.patchValue({ district: addr.district });
          const matchedDistrict = this.districts.find(d => d.district_name_en === addr.district);
          this.savedDistrictAr = matchedDistrict?.district_name_ar || addr.district;
        } else {
          this.savedDistrictAr = '';
        }
        this.cdr.markForCheck();
      });
    }
  }

  editAddress(): void {
    this.showForm = true;
  }

  useSavedAddress(): void {
    if (this.savedAddress) {
      this.prefillFromAddress(this.savedAddress);
      this.showForm = false;
    }
  }

  selectPayment(method: 'cod' | 'instapay'): void {
    this.paymentMethod.set(method);
  }

  get f() {
    return this.checkoutForm.controls;
  }

  onGovernorateChange(): void {
    const govName = this.checkoutForm.get('governorate')!.value;
    this.selectedGovernorate = this.governorates.find(
      g => g.governorate_name_en === govName
    ) || null;

    if (this.selectedGovernorate) {
      this.shippingCost = this.computeShipping();
      this.updateDeliveryRange();
      this.governorateService.getCities(this.selectedGovernorate.id).subscribe(cities => {
        this.cities = cities;
        this.cdr.markForCheck();
      });
    } else {
      this.cities = [];
      this.shippingCost = 0;
      this.deliveryFromLabel.set('');
      this.deliveryToLabel.set('');
    }

    this.districts = [];
    this.checkoutForm.get('city')!.setValue('');
    this.checkoutForm.get('district')!.setValue('');
  }

  onCityChange(): void {
    const cityName = this.checkoutForm.get('city')!.value;
    const city = this.cities.find(c => c.city_name_en === cityName);
    this.districts = city?.districts || [];
    this.checkoutForm.get('district')!.setValue('');
    this.cdr.markForCheck();
  }

  private isFarGovernorate(): boolean {
    if (!this.selectedGovernorate) return false;
    return FAR_GOVERNORATES_EN.includes(this.selectedGovernorate.governorate_name_en);
  }

  private updateDeliveryRange(): void {
    const far = this.isFarGovernorate();
    const fromOffset = far ? 2 : 1;
    const toOffset = far ? 3 : 2;
    const now = new Date();
    const from = new Date(now);
    from.setDate(now.getDate() + fromOffset);
    const to = new Date(now);
    to.setDate(now.getDate() + toOffset);
    this.deliveryFromLabel.set(this.formatDate(from));
    this.deliveryToLabel.set(this.formatDate(to));
  }

  private formatDate(d: Date): string {
    const lang = this.translationService.currentLang();
    const locale = lang === 'ar' ? 'ar-EG' : 'en-GB';
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'long' });
  }

  private startCutoffTimer(): void {
    const tick = () => {
      const now = new Date();
      const cutoff = new Date(now);
      cutoff.setHours(18, 0, 0, 0);
      if (now >= cutoff) {
        cutoff.setDate(cutoff.getDate() + 1);
      }
      const diff = Math.max(0, cutoff.getTime() - now.getTime());
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      this.cutoffHours.set(h);
      this.cutoffMinutes.set(m);
      this.cutoffSeconds.set(s);
      this.cdr.markForCheck();
    };
    tick();
    this.cutoffTimer = setInterval(tick, 1000);
  }

  pad(n: number): string {
    return n.toString().padStart(2, '0');
  }

  async onSubmit(): Promise<void> {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    // Capture cart data BEFORE clearing
    const cartItems = await firstValueFrom(this.cartService.cart$);
    const cartTotal = await firstValueFrom(this.cartService.cartTotal$);
    const cartSubtotal = await firstValueFrom(this.cartService.cartSubtotal$);
    const cartDiscount = await firstValueFrom(this.cartService.cartDiscount$);

    // Build order with actual items
    this.orderId = 'ORD-' + Date.now().toString(36).toUpperCase();
    const orderItems = cartItems.map(item => ({
      productId: item.product.id,
      title: item.product.title,
      titleAr: item.product.titleAr || item.product.title,
      quantity: item.quantity,
      price: item.product.price * (1 - item.product.discountPercentage / 100)
    }));

    const user = this.authService.getCurrentUser();
    const shippingAddress: IAddress = {
      fullName: user?.name || '',
      phone: user?.phone || '',
      ...this.checkoutForm.value
    };

    const promoDiscount = this.cartService.promoApplied() ? this.cartService.PROMO_DISCOUNT : 0;
    const shippingCompany = 'J&T Express';
    const paymentMethod = this.paymentMethod();
    const notes = this.notes?.trim() || '';

    const order: IOrder = {
      id: this.orderId,
      items: orderItems,
      total: cartTotal + this.shippingCost - promoDiscount,
      shippingCost: this.shippingCost,
      shippingAddress,
      shippingCompany,
      paymentMethod,
      notes,
      date: new Date().toISOString(),
      status: 'pending'
    };

    // Save order to backend (non-blocking)
    const orderPayload = {
      ...order,
      customer: {
        name: user?.name || shippingAddress.fullName,
        phone: user?.phone || shippingAddress.phone,
        email: user?.email || '',
      },
      subtotal: cartSubtotal,
      discount: cartDiscount,
      promoCode: this.cartService.promoApplied() ? this.cartService.promoCode() : null,
      promoDiscount: promoDiscount,
      shippingCompany,
      paymentMethod,
      paymentStatus: 'unpaid',
      notes,
      items: cartItems.map(item => ({
        productId: item.product.id,
        title: item.product.title,
        titleAr: item.product.titleAr || item.product.title,
        image: item.product.images?.[0] || '',
        merchant: item.product.merchant || '',
        quantity: item.quantity,
        price: item.product.price * (1 - item.product.discountPercentage / 100),
        total: item.quantity * item.product.price * (1 - item.product.discountPercentage / 100),
      })),
    };
    this.http.post(`${API_CONFIG.ordersUrl}`, orderPayload).subscribe();

    // Save address to user profile (non-blocking)
    if (this.authService.isLoggedIn()) {
      this.authService.saveAddress(shippingAddress).subscribe();
    }

    // Clear cart and show success
    this.cartService.clearCart();
    this.orderPlaced = true;

    // Launch fireworks
    this.launchFireworks();

    // Countdown and redirect
    this.countdown.set(10);
    const interval = setInterval(() => {
      const val = this.countdown() - 1;
      this.countdown.set(val);
      this.cdr.markForCheck();
      if (val <= 0) {
        clearInterval(interval);
        this.router.navigate(['/']);
      }
    }, 1000);
  }

  private launchFireworks(): void {
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

    confetti({ particleCount: 100, spread: 100, origin: { y: 0.6 }, colors });

    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }
}
