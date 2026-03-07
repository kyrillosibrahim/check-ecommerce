import { Component, inject, ChangeDetectorRef, HostListener, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthDrawerService, AuthDrawerView } from '../../../core/services/auth-drawer.service';
import { SiteSettingsService } from '../../../core/services/settings.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import emailjs from '@emailjs/browser';

@Component({
  selector: 'app-auth-drawer',
  imports: [AsyncPipe, ReactiveFormsModule, TranslatePipe],
  templateUrl: './auth-drawer.component.html',
  styleUrl: './auth-drawer.component.scss'
})
export class AuthDrawerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private settingsService = inject(SiteSettingsService);
  drawerService = inject(AuthDrawerService);

  logoUrl = 'assets/logobluewithoutbg.png';
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  // Forgot password step
  forgotStep: 'email' | 'reset' = 'email';
  private forgotEmail = '';

  // Login form
  loginForm = this.fb.group({
    phone: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  // Register form
  registerForm = this.fb.group({
    name: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordsMatch });

  // Forgot password forms
  emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });
  resetForm = this.fb.group({
    otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit(): void {
    this.settingsService.getSettings().subscribe(settings => {
      if (settings.logo) {
        this.logoUrl = this.settingsService.getLogoUrl(settings.logo);
      }
      this.cdr.markForCheck();
    });
  }

  get lf() { return this.loginForm.controls; }
  get rf() { return this.registerForm.controls; }
  get ef() { return this.emailForm.controls; }
  get rsf() { return this.resetForm.controls; }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.drawerService.isOpen()) {
      this.drawerService.close();
    }
  }

  passwordsMatch(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirm = control.get('confirmPassword')?.value;
    if (password && confirm && password !== confirm) {
      return { passwordsMismatch: true };
    }
    return null;
  }

  switchView(view: AuthDrawerView): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = false;
    this.forgotStep = 'email';
    this.loginForm.reset();
    this.registerForm.reset();
    this.emailForm.reset();
    this.resetForm.reset();
    this.drawerService.switchView(view);
  }

  // Login
  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const { phone, password } = this.loginForm.value;

    this.authService.login(phone!, password!).subscribe({
      next: () => {
        this.isLoading = false;
        const pendingUrl = this.drawerService.getPendingUrl();
        this.drawerService.close();
        if (pendingUrl) {
          this.router.navigate([pendingUrl]);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.error || 'login.error_invalid';
        this.cdr.markForCheck();
      }
    });
  }

  // Register
  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const { name, phone, email, password, confirmPassword } = this.registerForm.value;

    this.authService.register(name!, phone!, email!, password!, confirmPassword!).subscribe({
      next: () => {
        this.isLoading = false;
        const pendingUrl = this.drawerService.getPendingUrl();
        this.drawerService.close();
        if (pendingUrl) {
          this.router.navigate([pendingUrl]);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.error || 'حدث خطأ أثناء التسجيل';
        this.cdr.markForCheck();
      }
    });
  }

  // Forgot password - send OTP
  sendOtp(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.forgotEmail = this.emailForm.value.email!;

    this.authService.forgotPassword(this.forgotEmail).subscribe({
      next: (res) => {
        emailjs.send('service_xbrfnvs', 'template_3ybvtsk', {
          to_email: this.forgotEmail,
          to_name: res.userName,
          otp_code: res.otp,
        }, 'astjtvircAmBPiUZ0').then(() => {
          this.isLoading = false;
          this.forgotStep = 'reset';
          this.successMessage = 'forgot.otp_sent';
          this.cdr.markForCheck();
        }).catch(() => {
          this.isLoading = false;
          this.forgotStep = 'reset';
          this.successMessage = 'forgot.otp_sent';
          this.cdr.markForCheck();
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.error || 'حدث خطأ';
        this.cdr.markForCheck();
      }
    });
  }

  // Forgot password - reset
  onResetPassword(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    const { otp, newPassword } = this.resetForm.value;

    this.authService.resetPassword(this.forgotEmail, otp!, newPassword!).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'forgot.success';
        this.errorMessage = '';
        this.cdr.markForCheck();
        setTimeout(() => this.switchView('login'), 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.error || 'حدث خطأ';
        this.cdr.markForCheck();
      }
    });
  }
}
