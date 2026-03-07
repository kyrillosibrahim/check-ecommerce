import { Component, inject, OnInit, signal, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IUser } from '../../core/models/user.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  user: IUser | null = null;

  // Email edit state
  editingEmail = signal(false);
  emailSaving = signal(false);
  emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  // Password change state
  showPasswordSection = signal(false);
  passwordSaving = signal(false);
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);
  passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    if (!this.user) {
      this.router.navigate(['/']);
      return;
    }
    this.emailForm.patchValue({ email: this.user.email });
    this.cdr.markForCheck();
  }

  showNameInfo(): void {
    Swal.fire({
      icon: 'info',
      title: 'تغيير الاسم',
      text: 'يرجى التواصل مع خدمة الدعم لتغيير الاسم',
      confirmButtonText: 'حسنًا',
      confirmButtonColor: 'var(--sz-accent)',
      background: 'var(--sz-bg-card)',
      color: 'var(--sz-text-primary)',
    });
  }

  // ── Email ──
  startEditEmail(): void {
    this.emailForm.patchValue({ email: this.user!.email });
    this.editingEmail.set(true);
  }

  cancelEditEmail(): void {
    this.editingEmail.set(false);
    this.emailForm.patchValue({ email: this.user!.email });
  }

  saveEmail(): void {
    if (this.emailForm.invalid) return;
    const newEmail = this.emailForm.value.email!.trim();
    if (newEmail === this.user!.email) {
      this.editingEmail.set(false);
      return;
    }

    this.emailSaving.set(true);
    this.authService.updateEmail(newEmail).subscribe({
      next: (updated) => {
        this.user = { ...updated, token: this.user!.token };
        this.editingEmail.set(false);
        this.emailSaving.set(false);
        this.cdr.markForCheck();
        Swal.fire({
          icon: 'success',
          title: 'تم التحديث',
          text: 'تم تحديث البريد الإلكتروني بنجاح',
          timer: 2000,
          showConfirmButton: false,
          background: 'var(--sz-bg-card)',
          color: 'var(--sz-text-primary)',
        });
      },
      error: (err) => {
        this.emailSaving.set(false);
        this.cdr.markForCheck();
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: err.error?.error || 'حدث خطأ أثناء تحديث البريد الإلكتروني',
          confirmButtonText: 'حسنًا',
          confirmButtonColor: 'var(--sz-accent)',
          background: 'var(--sz-bg-card)',
          color: 'var(--sz-text-primary)',
        });
      },
    });
  }

  // ── Password ──
  togglePasswordSection(): void {
    this.showPasswordSection.update(v => !v);
    if (!this.showPasswordSection()) {
      this.passwordForm.reset();
    }
  }

  savePassword(): void {
    if (this.passwordForm.invalid) return;

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: 'كلمة المرور الجديدة وتأكيدها غير متطابقتين',
        confirmButtonText: 'حسنًا',
        confirmButtonColor: 'var(--sz-accent)',
        background: 'var(--sz-bg-card)',
        color: 'var(--sz-text-primary)',
      });
      return;
    }

    this.passwordSaving.set(true);
    this.authService.changePassword(currentPassword!, newPassword!).subscribe({
      next: () => {
        this.passwordSaving.set(false);
        this.showPasswordSection.set(false);
        this.passwordForm.reset();
        this.cdr.markForCheck();
        Swal.fire({
          icon: 'success',
          title: 'تم التحديث',
          text: 'تم تغيير كلمة المرور بنجاح',
          timer: 2000,
          showConfirmButton: false,
          background: 'var(--sz-bg-card)',
          color: 'var(--sz-text-primary)',
        });
      },
      error: (err) => {
        this.passwordSaving.set(false);
        this.cdr.markForCheck();
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: err.error?.error || 'حدث خطأ أثناء تغيير كلمة المرور',
          confirmButtonText: 'حسنًا',
          confirmButtonColor: 'var(--sz-accent)',
          background: 'var(--sz-bg-card)',
          color: 'var(--sz-text-primary)',
        });
      },
    });
  }
}
