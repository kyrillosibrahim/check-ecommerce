import { Pipe, PipeTransform } from '@angular/core';

/**
 * Injects Cloudinary delivery transformations into an image URL so the browser
 * downloads a right-sized, auto-format, auto-quality image instead of the full
 * original. Non-Cloudinary URLs (e.g. local /uploads) are returned untouched.
 *
 * `c_limit` never upscales and preserves aspect ratio, so it's safe to request a
 * width larger than the source.
 *
 * @param width Maximum output width when no positive height is provided.
 * @param height Optional maximum output height; when positive, width is ignored.
 *
 * Usage: `[src]="img | cldImage:400"`
 * Height usage: `[src]="img | cldImage:0:120"`
 */
@Pipe({ name: 'cldImage', standalone: true })
export class CldImagePipe implements PipeTransform {
  transform(url: string | null | undefined, width = 400, height?: number): string {
    if (!url) return '';
    const marker = '/image/upload/';
    const i = url.indexOf(marker);
    if (i === -1 || !url.includes('res.cloudinary.com')) return url;

    const start = i + marker.length;
    const rest = url.slice(start);
    // Already transformed (idempotent) — don't stack transforms.
    if (/^[a-z]_[a-z0-9]/i.test(rest) && /(^|,)(f_auto|q_auto|w_\d|h_\d)/.test(rest.split('/')[0])) {
      return url;
    }
    if (height !== undefined && height > 0) {
      return `${url.slice(0, start)}f_auto,q_auto,c_limit,h_${height}/${rest}`;
    }
    return `${url.slice(0, start)}f_auto,q_auto,c_limit,w_${width}/${rest}`;
  }
}
