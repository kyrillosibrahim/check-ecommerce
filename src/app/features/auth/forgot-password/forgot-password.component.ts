import { ChangeDetectionStrategy, Component, inject, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, TranslatePipe, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  step: 'phone' | 'reset' = 'phone';
  phone = '';
  otp = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  phoneForm = this.fb.group({
    phone: ['', [Validators.required]]
  });

  resetForm = this.fb.group({
    otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  get pf() { return this.phoneForm.controls; }
  get rf() { return this.resetForm.controls; }

  sendOtp(): void {
    if (this.phoneForm.invalid) {
      this.phoneForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.phone = this.phoneForm.value.phone!;

    this.authService.forgotPassword(this.phone).subscribe({
      next: (res) => {
        this.otp = res.otp;
        this.isLoading = false;
        this.step = 'reset';
        this.successMessage = 'forgot.otp_sent';
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.error || 'حدث خطأ';
        this.cdr.markForCheck();
      }
    });
  }

  resetPassword(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    const { otp, newPassword } = this.resetForm.value;

    this.authService.resetPassword(this.phone, otp!, newPassword!).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'forgot.success';
        this.errorMessage = '';
        this.cdr.markForCheck();
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.error || 'حدث خطأ';
        this.cdr.markForCheck();
      }
    });
  }
}
