import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AsyncPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import confetti from 'canvas-confetti';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { GovernorateService } from '../../core/services/governorate.service';
import { API_CONFIG } from '../../core/config/api.config';
import { IOrder, IAddress } from '../../core/models/user.model';
import { IGovernorateApi, ICityApi } from '../../core/models/governorate.model';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LocalizePipe } from '../../shared/pipes/localize.pipe';
import { TranslationService } from '../../core/services/translation.service';
import { EgpCurrencyPipe } from '../../shared/pipes/egp-currency.pipe';

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, AsyncPipe, EgpCurrencyPipe, RouterLink, TranslatePipe, LocalizePipe],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent {
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

  governorates: IGovernorateApi[] = [];
  selectedGovernorate: IGovernorateApi | null = null;
  cities: ICityApi[] = [];
  shippingCost = 0;

  savedAddress: IAddress | null = null;
  savedGovAr = '';
  savedCityAr = '';
  showForm = false;

  checkoutForm: FormGroup = this.fb.group({
    governorate: ['', [Validators.required]],
    city: ['', [Validators.required]],
    address: ['', [Validators.required]],
  });

  constructor() {
    this.cartService.loadCart();
    this.loadGovernorates();
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
      this.shippingCost = this.selectedGovernorate.shippingCost;
      this.savedGovAr = this.selectedGovernorate.governorate_name_ar;
      this.governorateService.getCities(this.selectedGovernorate.id).subscribe(cities => {
        this.cities = cities;
        this.checkoutForm.patchValue({ city: addr.city });
        const matchedCity = cities.find(c => c.city_name_en === addr.city);
        this.savedCityAr = matchedCity?.city_name_ar || addr.city;
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

  get f() {
    return this.checkoutForm.controls;
  }

  onGovernorateChange(): void {
    const govName = this.checkoutForm.get('governorate')!.value;
    this.selectedGovernorate = this.governorates.find(
      g => g.governorate_name_en === govName
    ) || null;

    if (this.selectedGovernorate) {
      this.shippingCost = this.selectedGovernorate.shippingCost;
      this.governorateService.getCities(this.selectedGovernorate.id).subscribe(cities => {
        this.cities = cities;
        this.cdr.markForCheck();
      });
    } else {
      this.cities = [];
      this.shippingCost = 0;
    }

    this.checkoutForm.get('city')!.setValue('');
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

    const order: IOrder = {
      id: this.orderId,
      items: orderItems,
      total: cartTotal + this.shippingCost,
      shippingCost: this.shippingCost,
      shippingAddress,
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

    // Redirect after 8 seconds
    setTimeout(() => this.router.navigate(['/']), 8000);
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
