import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { Location } from '@angular/common';
import { ICategory, ISubcategory } from '../../../../core/models/category.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-product-filter',
  imports: [TranslatePipe],
  templateUrl: './product-filter.component.html',
  styleUrl: './product-filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFilterComponent {
  private location = inject(Location);
  @Input() categories: ICategory[] = [];
  @Input() selectedCategory = '';
  @Input() selectedSubcategory = '';
  @Input() sortBy = 'default';
  @Input() searchTerm = '';
  @Input() selectedFilterTags: string[] = [];
  @Input() drawerMode = false;
  @Input() hideCategories = false;
  @Input() hideSort = false;

  @Output() categoryChange = new EventEmitter<string>();
  @Output() subcategoryChange = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<string>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() filterTagsChange = new EventEmitter<string[]>();

  get activeCategory(): ICategory | undefined {
    return this.categories.find(c => c.slug === this.selectedCategory);
  }

  get subcategories(): ISubcategory[] {
    return this.activeCategory?.subcategories || [];
  }

  get availableFilterTags(): string[] {
    if (!this.selectedCategory) return [];
    return this.activeCategory?.filterTags || [];
  }

  goBack(): void {
    this.location.back();
  }

  toggleFilterTag(tag: string): void {
    const current = [...this.selectedFilterTags];
    const idx = current.indexOf(tag);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(tag);
    }
    this.filterTagsChange.emit(current);
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchChange.emit(value);
  }
}
