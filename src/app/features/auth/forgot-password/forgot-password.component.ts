import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import emailjs from '@emailjs/browser';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, TranslatePipe, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  step: 'email' | 'reset' = 'email';
  email = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  resetForm = this.fb.group({
    otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  get ef() { return this.emailForm.controls; }
  get rf() { return this.resetForm.controls; }

  sendOtp(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.email = this.emailForm.value.email!;

    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        // Send OTP email via EmailJS from browser
        emailjs.send('service_xbrfnvs', 'template_3ybvtsk', {
          to_email: this.email,
          to_name: res.userName,
          otp_code: res.otp,
        }, 'astjtvircAmBPiUZ0').then(() => {
          this.isLoading = false;
          this.step = 'reset';
          this.successMessage = 'forgot.otp_sent';
          this.cdr.markForCheck();
        }).catch(() => {
          this.isLoading = false;
          this.step = 'reset';
          this.successMessage = 'forgot.otp_sent';
          this.cdr.markForCheck();
        });

      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.error || 'حدث خطأ';
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

    this.authService.resetPassword(this.email, otp!, newPassword!).subscribe({
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
