import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GovernorateService } from '../../core/services/governorate.service';
import { TranslationService } from '../../core/services/translation.service';
import { IGovernorateApi } from '../../core/models/governorate.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-governorates-dashboard',
  imports: [FormsModule, RouterLink],
  templateUrl: './governorates.component.html',
  styleUrl: './governorates.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GovernoratesDashboardComponent implements OnInit {
  private governorateService = inject(GovernorateService);
  private cdr = inject(ChangeDetectorRef);
  translationService = inject(TranslationService);

  governorates: IGovernorateApi[] = [];
  isLoading = signal(true);
  editingId: number | null = null;
  editingCost = 0;
  savingId = signal<number | null>(null);

  get isArabic(): boolean {
    return this.translationService.isArabic();
  }

  ngOnInit(): void {
    this.governorateService.clearCache();
    this.governorateService.getGovernorates().subscribe(govs => {
      this.governorates = govs;
      this.isLoading.set(false);
      this.cdr.markForCheck();
    });
  }

  startEdit(gov: IGovernorateApi): void {
    this.editingId = gov.id;
    this.editingCost = gov.shippingCost;
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(gov: IGovernorateApi): void {
    if (this.editingCost === gov.shippingCost) {
      this.editingId = null;
      return;
    }
    if (this.editingCost < 0 || isNaN(this.editingCost)) return;

    this.savingId.set(gov.id);
    this.governorateService.updateShippingCost(gov.id, this.editingCost).subscribe({
      next: (updated) => {
        const idx = this.governorates.findIndex(g => g.id === gov.id);
        if (idx !== -1) this.governorates[idx] = updated;
        this.editingId = null;
        this.savingId.set(null);
        this.cdr.markForCheck();

        Swal.fire({
          icon: 'success',
          title: this.isArabic ? 'تم التحديث' : 'Updated',
          text: this.isArabic
            ? `تم تحديث سعر الشحن لـ ${updated.governorate_name_ar} إلى ${updated.shippingCost} جنيه`
            : `Shipping cost for ${updated.governorate_name_en} updated to ${updated.shippingCost} EGP`,
          timer: 2000,
          showConfirmButton: false,
        });
      },
      error: () => {
        this.savingId.set(null);
        this.cdr.markForCheck();
        Swal.fire({
          icon: 'error',
          title: this.isArabic ? 'خطأ' : 'Error',
          text: this.isArabic ? 'فشل تحديث سعر الشحن' : 'Failed to update shipping cost',
        });
      },
    });
  }

  getName(gov: IGovernorateApi): string {
    return this.isArabic ? gov.governorate_name_ar : gov.governorate_name_en;
  }
}
