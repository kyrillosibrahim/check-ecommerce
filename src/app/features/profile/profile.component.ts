import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, NgZone, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { GovernorateService } from '../../core/services/governorate.service';
import { IUser, IAddress } from '../../core/models/user.model';
import { IGovernorateApi, ICityApi } from '../../core/models/governorate.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private ngZone = inject(NgZone);
  private governorateService = inject(GovernorateService);
  private cdr = inject(ChangeDetectorRef);

  user: IUser | null = null;

  // Navigation
  activeSection = signal<'account' | 'addresses'>('account');

  // Password
  showPasswordSection = signal(false);
  passwordSaving = signal(false);
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);
  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  });

  // Addresses
  showAddressForm = signal(false);
  editingAddress = signal<IAddress | null>(null);
  savingAddress = signal(false);
  governorates: IGovernorateApi[] = [];
  cities: ICityApi[] = [];
  selectedGov: IGovernorateApi | null = null;
  addressForm = this.fb.group({
    fullName: ['', Validators.required],
    phone: ['', Validators.required],
    governorate: ['', Validators.required],
    city: ['', Validators.required],
    address: ['', Validators.required],
  });

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    if (!this.user) { this.router.navigate(['/']); return; }
    this.route.queryParamMap.subscribe(params => {
      const section = params.get('section');
      if (section === 'addresses') this.activeSection.set('addresses');
      else this.activeSection.set('account');
      this.cdr.markForCheck();
    });
    this.governorateService.getGovernorates().subscribe(govs => {
      this.governorates = govs;
      this.cdr.markForCheck();
    });
    this.cdr.markForCheck();
  }

  // ── Account ──
  showNameInfo(): void {
    Swal.fire({
      icon: 'info', title: 'تغيير الاسم',
      text: 'يرجى التواصل مع خدمة الدعم لتغيير الاسم',
      confirmButtonText: 'حسنًا', confirmButtonColor: 'var(--sz-accent)',
      background: 'var(--sz-bg-card)', color: 'var(--sz-text-primary)',
    });
  }

  // ── Password ──
  togglePasswordSection(): void {
    this.showPasswordSection.update(v => !v);
    if (!this.showPasswordSection()) this.passwordForm.reset();
  }

  savePassword(): void {
    if (this.passwordForm.invalid) return;
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      Swal.fire({ icon: 'error', title: 'خطأ', text: 'كلمتا المرور غير متطابقتين',
        confirmButtonText: 'حسنًا', confirmButtonColor: 'var(--sz-accent)',
        background: 'var(--sz-bg-card)', color: 'var(--sz-text-primary)' });
      return;
    }
    this.passwordSaving.set(true);
    this.authService.changePassword(currentPassword!, newPassword!).subscribe({
      next: () => {
        this.passwordSaving.set(false);
        this.showPasswordSection.set(false);
        this.passwordForm.reset();
        this.cdr.markForCheck();
        Swal.fire({ icon: 'success', title: 'تم التحديث', text: 'تم تغيير كلمة المرور بنجاح',
          timer: 2000, showConfirmButton: false,
          background: 'var(--sz-bg-card)', color: 'var(--sz-text-primary)' });
      },
      error: (err) => {
        this.passwordSaving.set(false);
        this.cdr.markForCheck();
        Swal.fire({ icon: 'error', title: 'خطأ',
          text: err.error?.error || 'حدث خطأ أثناء تغيير كلمة المرور',
          confirmButtonText: 'حسنًا', confirmButtonColor: 'var(--sz-accent)',
          background: 'var(--sz-bg-card)', color: 'var(--sz-text-primary)' });
      },
    });
  }

  // ── Addresses ──
  openAddForm(): void {
    this.editingAddress.set(null);
    this.addressForm.reset({ fullName: this.user?.name || '', phone: this.user?.phone || '' });
    this.cities = [];
    this.selectedGov = null;
    this.showAddressForm.set(true);
  }

  editAddress(addr: IAddress): void {
    this.editingAddress.set(addr);
    this.addressForm.patchValue({ fullName: addr.fullName, phone: addr.phone, governorate: addr.governorate, city: addr.city, address: addr.address });
    this.selectedGov = this.governorates.find(g => g.governorate_name_en === addr.governorate) || null;
    if (this.selectedGov) {
      this.governorateService.getCities(this.selectedGov.id).subscribe(cities => {
        this.cities = cities;
        this.addressForm.patchValue({ city: addr.city });
        this.cdr.markForCheck();
      });
    }
    this.showAddressForm.set(true);
  }

  cancelAddressForm(): void {
    this.showAddressForm.set(false);
    this.editingAddress.set(null);
    this.addressForm.reset();
    this.cities = [];
  }

  onGovernorateChange(): void {
    const govName = this.addressForm.get('governorate')!.value;
    this.selectedGov = this.governorates.find(g => g.governorate_name_en === govName) || null;
    this.addressForm.patchValue({ city: '' });
    this.cities = [];
    if (this.selectedGov) {
      this.governorateService.getCities(this.selectedGov.id).subscribe(cities => {
        this.cities = cities;
        this.cdr.markForCheck();
      });
    }
  }

  saveAddress(): void {
    if (this.addressForm.invalid) return;
    const { fullName, phone, governorate, city, address } = this.addressForm.value;
    const newAddr: IAddress = { fullName: fullName!, phone: phone!, governorate: governorate!, city: city!, address: address! };
    this.savingAddress.set(true);
    this.authService.saveAddress(newAddr).subscribe({
      next: () => {
        this.user = this.authService.getCurrentUser();
        this.savingAddress.set(false);
        this.showAddressForm.set(false);
        this.editingAddress.set(null);
        this.addressForm.reset();
        this.cities = [];
        this.cdr.markForCheck();
        Swal.fire({ icon: 'success', title: 'تم الحفظ', text: 'تم حفظ العنوان بنجاح',
          timer: 1800, showConfirmButton: false,
          background: 'var(--sz-bg-card)', color: 'var(--sz-text-primary)' });
      },
      error: () => {
        this.savingAddress.set(false);
        this.cdr.markForCheck();
        Swal.fire({ icon: 'error', title: 'خطأ', text: 'حدث خطأ أثناء حفظ العنوان',
          confirmButtonText: 'حسنًا', confirmButtonColor: 'var(--sz-accent)',
          background: 'var(--sz-bg-card)', color: 'var(--sz-text-primary)' });
      },
    });
  }

  locating = signal(false);

  private normalizeName(s: string): string {
    return (s || '')
      .toLowerCase()
      .replace(/\s*governorate\s*/g, '')
      .replace(/\s*محافظة\s*/g, '')
      .replace(/^(al-|al\s|el-|el\s|ال)/, '')
      .replace(/[^a-z0-9\u0600-\u06FF]/g, '')
      .trim();
  }

  private fuzzyMatch(needle: string, haystack: string): boolean {
    if (!needle || !haystack) return false;
    const n = this.normalizeName(needle);
    const h = this.normalizeName(haystack);
    if (!n || !h) return false;
    return n === h || n.includes(h) || h.includes(n);
  }

  useCurrentLocation(): void {
    if (!navigator.geolocation) return;
    this.locating.set(true);
    this.cdr.markForCheck();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.ngZone.run(() => {
          const { latitude, longitude } = pos.coords;
          // Request both Arabic and English to maximize matching chances
          const urlAr = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ar`;
          const urlEn = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`;

          this.http.get<any>(urlAr).subscribe({
            next: (dataAr) => {
              this.http.get<any>(urlEn).subscribe({
                next: (dataEn) => this.applyLocationData(dataAr, dataEn),
                error: () => this.applyLocationData(dataAr, dataAr),
              });
            },
            error: () => { this.locating.set(false); this.cdr.markForCheck(); },
          });
        });
      },
      () => {
        this.ngZone.run(() => {
          this.locating.set(false);
          Swal.fire({ icon: 'warning', title: 'تنبيه', text: 'تعذر الوصول لموقعك. تأكد من منح صلاحية الموقع للمتصفح', confirmButtonText: 'حسنًا', confirmButtonColor: 'var(--sz-accent)', background: 'var(--sz-bg-card)', color: 'var(--sz-text-primary)' });
        });
      },
      { timeout: 8000 }
    );
  }

  private applyLocationData(dataAr: any, dataEn: any): void {
    const aAr = dataAr.address || {};
    const aEn = dataEn.address || {};

    // ── Address detail (prefer Arabic) ──
    const parts = [aAr.road, aAr.neighbourhood, aAr.suburb, aAr.village].filter(Boolean);
    const fallbackParts = [aEn.road, aEn.neighbourhood, aEn.suburb, aEn.village].filter(Boolean);
    this.addressForm.patchValue({ address: parts.join('، ') || fallbackParts.join(', ') || '' });

    // ── Match governorate (try Arabic then English) ──
    const stateAr = aAr.state || aAr.county || '';
    const stateEn = aEn.state || aEn.county || '';

    const matchedGov = this.governorates.find(g =>
      this.fuzzyMatch(stateAr, g.governorate_name_ar) ||
      this.fuzzyMatch(stateEn, g.governorate_name_en) ||
      this.fuzzyMatch(stateAr, g.governorate_name_en) ||
      this.fuzzyMatch(stateEn, g.governorate_name_ar)
    );

    if (matchedGov) {
      this.addressForm.patchValue({ governorate: matchedGov.governorate_name_en, city: '' });
      this.selectedGov = matchedGov;
      this.cities = [];

      const cityAr = aAr.city || aAr.town || aAr.municipality || aAr.village || '';
      const cityEn = aEn.city || aEn.town || aEn.municipality || aEn.village || '';

      this.governorateService.getCities(matchedGov.id).subscribe(cities => {
        this.cities = cities;
        const matchedCity = cities.find(c =>
          this.fuzzyMatch(cityAr, c.city_name_ar) ||
          this.fuzzyMatch(cityEn, c.city_name_en) ||
          this.fuzzyMatch(cityAr, c.city_name_en) ||
          this.fuzzyMatch(cityEn, c.city_name_ar)
        );
        if (matchedCity) {
          this.addressForm.patchValue({ city: matchedCity.city_name_en });
        }
        this.locating.set(false);
        this.cdr.markForCheck();
      });
    } else {
      this.locating.set(false);
      this.cdr.markForCheck();
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  get firstName(): string {
    if (!this.user?.name) return '';
    return this.user.name.split(' ')[0];
  }

  get lastName(): string {
    if (!this.user?.name) return '';
    const parts = this.user.name.split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
  }
}
