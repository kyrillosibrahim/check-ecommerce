import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { GovernorateService } from '../../../core/services/governorate.service';
import { CartService } from '../../../core/services/cart.service';
import { TranslationService } from '../../../core/services/translation.service';
import { IGovernorateApi } from '../../../core/models/governorate.model';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LocalizePipe } from '../../pipes/localize.pipe';
import { EgpCurrencyPipe } from '../../pipes/egp-currency.pipe';

const FAR_GOVERNORATES_EN = [
  'Red Sea', 'Aswan', 'Luxor', 'Matrouh', 'New Valley',
  'North Sinai', 'South Sinai', 'Asyut', 'Sohag', 'Qena', 'Minya',
];

@Component({
  selector: 'app-shipping-estimator',
  imports: [FormsModule, TranslatePipe, LocalizePipe, EgpCurrencyPipe],
  templateUrl: './shipping-estimator.component.html',
  styleUrl: './shipping-estimator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShippingEstimatorComponent implements OnInit, OnDestroy {
  @Input() initialItemsCount: number | null = null;
  @Output() shippingCostChange = new EventEmitter<number>();
  @Output() governorateChange = new EventEmitter<IGovernorateApi | null>();

  private cdr = inject(ChangeDetectorRef);
  private governorateService = inject(GovernorateService);
  private cartService = inject(CartService);
  translationService = inject(TranslationService);

  governorates: IGovernorateApi[] = [];
  selectedGovernorateName = '';
  selectedGovernorate: IGovernorateApi | null = null;
  shippingCost = 0;
  private currentItemsCount = 1;
  private cartCountSub?: Subscription;

  deliveryFromLabel = signal('');
  deliveryToLabel = signal('');
  cutoffHours = signal(0);
  cutoffMinutes = signal(0);
  cutoffSeconds = signal(0);
  private cutoffTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.currentItemsCount = this.initialItemsCount ?? 1;

    this.governorateService.getGovernorates().subscribe(govs => {
      this.governorates = govs;
      this.cdr.markForCheck();
    });

    this.cartCountSub = this.cartService.cartCount$.subscribe(count => {
      this.currentItemsCount = count > 0 ? count : (this.initialItemsCount ?? 1);
      this.shippingCost = this.computeShipping();
      this.shippingCostChange.emit(this.shippingCost);
      this.cdr.markForCheck();
    });

    this.startCutoffTimer();
  }

  ngOnDestroy(): void {
    if (this.cutoffTimer) {
      clearInterval(this.cutoffTimer);
      this.cutoffTimer = null;
    }
    this.cartCountSub?.unsubscribe();
  }

  onGovernorateChange(): void {
    this.selectedGovernorate = this.governorates.find(
      g => g.governorate_name_en === this.selectedGovernorateName
    ) || null;

    if (this.selectedGovernorate) {
      this.shippingCost = this.computeShipping();
      this.updateDeliveryRange();
    } else {
      this.shippingCost = 0;
      this.deliveryFromLabel.set('');
      this.deliveryToLabel.set('');
    }

    this.shippingCostChange.emit(this.shippingCost);
    this.governorateChange.emit(this.selectedGovernorate);
    this.cdr.markForCheck();
  }

  private computeShipping(): number {
    if (!this.selectedGovernorate) return 0;
    const base = this.selectedGovernorate.shippingCost || 0;
    const extra = this.selectedGovernorate.extraShippingCost || 0;
    const tiers = Math.floor(this.currentItemsCount / 5);
    return base + tiers * extra;
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
      this.cutoffHours.set(Math.floor(diff / 3_600_000));
      this.cutoffMinutes.set(Math.floor((diff % 3_600_000) / 60_000));
      this.cutoffSeconds.set(Math.floor((diff % 60_000) / 1000));
      this.cdr.markForCheck();
    };
    tick();
    this.cutoffTimer = setInterval(tick, 1000);
  }

  pad(n: number): string {
    return n.toString().padStart(2, '0');
  }
}
