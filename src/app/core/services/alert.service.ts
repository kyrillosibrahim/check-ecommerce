import { Injectable } from '@angular/core';
import type { SweetAlertOptions, SweetAlertResult } from 'sweetalert2';

/**
 * Lazy wrapper around SweetAlert2.
 *
 * Importing `sweetalert2` at module top in services and components bloats the
 * initial chunk by ~60 KB. By dynamic-importing it here, the bundle is fetched
 * only the first time an alert/toast is actually shown.
 */
@Injectable({ providedIn: 'root' })
export class AlertService {
  private swalPromise?: Promise<typeof import('sweetalert2').default>;

  private load() {
    if (!this.swalPromise) {
      this.swalPromise = import('sweetalert2').then(m => m.default);
    }
    return this.swalPromise;
  }

  async fire(options: SweetAlertOptions): Promise<SweetAlertResult> {
    const Swal = await this.load();
    return Swal.fire(options);
  }

  async toast(options: SweetAlertOptions): Promise<SweetAlertResult> {
    const Swal = await this.load();
    return Swal.fire({
      toast: true,
      position: 'top-end',
      timer: 3000,
      timerProgressBar: true,
      showConfirmButton: false,
      ...options,
    });
  }
}
