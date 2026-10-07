import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CategoryService } from '../../core/services/category.service';
import { SeoService } from '../../core/services/seo.service';
import { TranslationService } from '../../core/services/translation.service';
import { ICategory } from '../../core/models/category.model';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { CldImagePipe } from '../../shared/pipes/cld-image.pipe';
import { LocalizePipe } from '../../shared/pipes/localize.pipe';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [RouterLink, TranslatePipe, CldImagePipe, LocalizePipe],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private categoryService = inject(CategoryService);
  private seoService = inject(SeoService);
  private translationService = inject(TranslationService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  categories = signal<ICategory[]>([]);
  isLoading = signal(true);
  /** Selected category id, kept in the `c` query param so back/share work */
  selectedId = signal<number | null>(null);

  selected = computed(() => {
    const cats = this.categories();
    return cats.find(c => c.id === this.selectedId()) ?? cats[0] ?? null;
  });

  ngOnInit(): void {
    this.seoService.setPageMeta({
      title: this.translationService.translate('nav.categories'),
      description: this.translationService.translate('seo.categories_description'),
      path: '/categories',
    });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = Number(params.get('c'));
        this.selectedId.set(Number.isFinite(id) && id > 0 ? id : null);
        if (this.isBrowser) window.scrollTo({ top: 0 });
      });

    this.categoryService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(cats => {
        this.categories.set(cats);
        this.isLoading.set(false);
      });
  }

  selectCategory(cat: ICategory): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { c: cat.id },
      replaceUrl: true,
    });
  }
}
