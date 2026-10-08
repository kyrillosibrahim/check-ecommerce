import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  QueryList,
  signal,
  ViewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { CategoryService } from '../../core/services/category.service';
import { BrandService } from '../../core/services/brand.service';
import { TranslationService } from '../../core/services/translation.service';
import { SeoService } from '../../core/services/seo.service';
import { ICategory } from '../../core/models/category.model';
import { IBrand } from '../../core/models/brand.model';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { CldImagePipe } from '../../shared/pipes/cld-image.pipe';

interface IBrandEntry {
  brand: IBrand;
  cats: ICategory[];
  key: string;
}

interface IBrandCategoryChip {
  category: ICategory;
  count: number;
}

interface IBrandLetter {
  key: string;
  label: string;
}

interface IBrandGroup extends IBrandLetter {
  entries: IBrandEntry[];
}

const BRAND_LETTERS: IBrandLetter[] = [
  ...Array.from({ length: 26 }, (_, index) => {
    const letter = String.fromCharCode(65 + index);
    return { key: letter, label: letter };
  }),
  { key: 'ar', label: 'أ-ي' },
  { key: 'other', label: '#' },
];

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [TranslatePipe, CldImagePipe],
  templateUrl: './brands.component.html',
  styleUrl: './brands.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandsComponent implements OnInit, AfterViewInit, OnDestroy {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private seoService = inject(SeoService);
  translationService = inject(TranslationService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private intersectionObserver?: IntersectionObserver;

  @ViewChildren('letterSection') letterSections!: QueryList<ElementRef<HTMLElement>>;

  entries = signal<IBrandEntry[]>([]);
  chipCats = signal<IBrandCategoryChip[]>([]);
  isLoading = signal(true);
  searchTerm = signal('');
  activeCatId = signal<number | null>(null);
  activeLetter = signal<string | null>(null);
  letters = BRAND_LETTERS;

  filtered = computed(() => {
    const categoryId = this.activeCatId();
    const term = this.searchTerm().trim().toLocaleLowerCase();

    return this.entries().filter(entry => {
      const matchesCategory = categoryId === null || entry.cats.some(cat => cat.id === categoryId);
      const matchesSearch = !term || entry.brand.name.toLocaleLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  });

  groups = computed<IBrandGroup[]>(() => {
    const entriesByKey = new Map<string, IBrandEntry[]>();
    for (const entry of this.filtered()) {
      const entries = entriesByKey.get(entry.key) ?? [];
      entries.push(entry);
      entriesByKey.set(entry.key, entries);
    }

    return this.letters.flatMap(letter => {
      const entries = entriesByKey.get(letter.key) ?? [];
      return entries.length ? [{ ...letter, entries }] : [];
    });
  });

  availableKeys = computed(() => new Set(this.groups().map(group => group.key)));

  ngOnInit(): void {
    this.seoService.setPageMeta({
      title: this.translationService.translate('nav.brands'),
      description: this.translationService.translate('seo.brands_description'),
      path: '/brands',
    });

    forkJoin({
      brands: this.brandService.getAll().pipe(catchError(() => of([]))),
      cats: this.categoryService.getAll().pipe(catchError(() => of([]))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ brands, cats }) => {
        this.setBrandData(brands, cats);
        this.isLoading.set(false);
      });
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser || !('IntersectionObserver' in window)) return;

    this.intersectionObserver = new IntersectionObserver(
      entries => this.updateActiveLetter(entries),
      { rootMargin: '-150px 0px -60% 0px' }
    );
    this.letterSections.changes
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.observeLetterSections());
    this.observeLetterSections();
  }

  ngOnDestroy(): void {
    this.intersectionObserver?.disconnect();
  }

  goToBrand(brand: IBrand): void {
    this.router.navigate(['/products'], { queryParams: { brand: brand.name } });
  }

  jumpTo(key: string): void {
    if (!this.isBrowser) return;
    document.getElementById('brands-letter-' + key)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  catsLabel(entry: IBrandEntry): string {
    const names = entry.cats.slice(0, 2).map(cat =>
      this.translationService.isArabic() ? cat.name : (cat.nameEn || cat.name)
    );
    const remaining = entry.cats.length - names.length;
    return names.join(' · ') + (remaining > 0 ? ' +' + remaining : '');
  }

  private setBrandData(brands: IBrand[], categories: ICategory[]): void {
    const categoriesByBrand = this.categoriesByBrand(categories);
    const entries = this.brandEntries(brands, categoriesByBrand);
    this.entries.set(entries);
    this.chipCats.set(this.categoryChips(categories, entries));
  }

  private categoriesByBrand(categories: ICategory[]): Map<number, ICategory[]> {
    const categoriesByBrand = new Map<number, ICategory[]>();
    for (const category of categories) {
      const categoryBrandIds = new Set<number>();
      for (const brand of category.famousBrands ?? []) {
        if (categoryBrandIds.has(brand.id)) continue;
        categoryBrandIds.add(brand.id);
        const brandCategories = categoriesByBrand.get(brand.id) ?? [];
        brandCategories.push(category);
        categoriesByBrand.set(brand.id, brandCategories);
      }
    }
    return categoriesByBrand;
  }

  private brandEntries(
    brands: IBrand[],
    categoriesByBrand: Map<number, ICategory[]>
  ): IBrandEntry[] {
    const uniqueEntries = new Map<number, IBrandEntry>();
    for (const brand of brands) {
      const name = brand.name?.trim();
      if (!name || uniqueEntries.has(brand.id)) continue;
      uniqueEntries.set(brand.id, {
        brand: name === brand.name ? brand : { ...brand, name },
        cats: categoriesByBrand.get(brand.id) ?? [],
        key: this.letterKey(name),
      });
    }
    return [...uniqueEntries.values()].sort((a, b) =>
      a.brand.name.localeCompare(b.brand.name, ['en', 'ar'], { sensitivity: 'base', numeric: true })
    );
  }

  private categoryChips(
    categories: ICategory[],
    entries: IBrandEntry[]
  ): IBrandCategoryChip[] {
    const counts = new Map<number, number>();
    for (const entry of entries) {
      for (const category of entry.cats) {
        counts.set(category.id, (counts.get(category.id) ?? 0) + 1);
      }
    }
    return categories.flatMap(category => {
      const count = counts.get(category.id) ?? 0;
      return count ? [{ category, count }] : [];
    });
  }

  private letterKey(name: string): string {
    const firstCharacter = name[0];
    if (/[A-Za-z]/.test(firstCharacter)) return firstCharacter.toUpperCase();
    if (/[\u0600-\u06FF]/.test(firstCharacter)) return 'ar';
    return 'other';
  }

  private observeLetterSections(): void {
    this.intersectionObserver?.disconnect();
    const activeLetter = this.activeLetter();
    if (activeLetter && !this.availableKeys().has(activeLetter)) this.activeLetter.set(null);
    this.letterSections.forEach(section => this.intersectionObserver?.observe(section.nativeElement));
  }

  private updateActiveLetter(entries: IntersectionObserverEntry[]): void {
    const visibleSection = entries.find(entry => entry.isIntersecting);
    const key = (visibleSection?.target as HTMLElement | undefined)?.dataset['key'];
    if (key) this.activeLetter.set(key);
  }
}
