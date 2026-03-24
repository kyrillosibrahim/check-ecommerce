import { Directive, HostListener, ElementRef, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * SafeInputDirective - prevents XSS by stripping dangerous characters from input fields.
 * Usage: add safeInput attribute to any <input> or <textarea>
 */
@Directive({
  selector: '[safeInput]',
  standalone: true
})
export class SafeInputDirective {
  private el = inject(ElementRef);
  private control = inject(NgControl, { optional: true });

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const original = input.value;

    const cleaned = original
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<[^>]*>/g, '');

    if (cleaned !== original) {
      input.value = cleaned;
      if (this.control?.control) {
        this.control.control.setValue(cleaned, { emitEvent: true });
      }
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    const cleaned = text
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<[^>]*>/g, '');

    const input = event.target as HTMLInputElement;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const current = input.value;
    const newValue = current.substring(0, start) + cleaned + current.substring(end);
    input.value = newValue;

    if (this.control?.control) {
      this.control.control.setValue(newValue, { emitEvent: true });
    }
  }
}
