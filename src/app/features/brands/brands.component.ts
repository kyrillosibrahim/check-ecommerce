import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CategoryService } from '../../core/services/category.service';
import { BrandService } from '../../core/services/brand.service';
import { TranslationService } from '../../core/services/translation.service';
import { SeoService } from '../../core/services/seo.service';
import { ICategory } from '../../core/models/category.model';
import { IBrand } from '../../core/models/brand.model';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './brands.component.html',
  styleUrl: './brands.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandsComponent implements OnInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private seoService = inject(SeoService);
  translationService = inject(TranslationService);

  categories = signal<ICategory[]>([]);
  isLoading = signal(true);
  searchTerm = '';

  ngOnInit(): void {
    this.seoService.setPageMeta({
      title: 'العلامات التجارية',
      description: 'تصفح جميع العلامات التجارية المتوفرة في كل قسم.',
      path: '/brands',
    });

    this.categoryService.getAll().subscribe(cats => {
      const withBrands = cats.filter(c => (c.famousBrands?.length ?? 0) > 0);
      this.categories.set(withBrands);
      this.isLoading.set(false);
      this.cdr.markForCheck();
    });
  }

  goToBrand(brand: IBrand): void {
    this.router.navigate(['/products'], { queryParams: { brand: brand.name } });
  }

  goToCategory(cat: ICategory): void {
    this.router.navigate(['/products'], { queryParams: { category: cat.id } });
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.cdr.markForCheck();
  }

  filteredBrands(brands: IBrand[] | undefined): IBrand[] {
    if (!brands) return [];
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return brands;
    return brands.filter(b => b.name.toLowerCase().includes(term));
  }

  trackCat = (_: number, c: ICategory) => c.id;
  trackBrand = (_: number, b: IBrand) => b.id;
}
