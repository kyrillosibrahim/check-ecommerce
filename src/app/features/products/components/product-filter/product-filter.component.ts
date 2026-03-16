import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { ICategory } from '../../../../core/models/category.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-product-filter',
  imports: [TranslatePipe],
  templateUrl: './product-filter.component.html',
  styleUrl: './product-filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFilterComponent {
  @Input() categories: ICategory[] = [];
  @Input() selectedCategory = '';
  @Input() sortBy = 'default';
  @Input() searchTerm = '';
  @Input() selectedFilterTags: string[] = [];
  @Input() drawerMode = false;
  @Input() hideCategories = false;
  @Input() hideSort = false;

  @Output() categoryChange = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<string>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() filterTagsChange = new EventEmitter<string[]>();

  get availableFilterTags(): string[] {
    if (!this.selectedCategory) return [];
    const cat = this.categories.find(c => c.slug === this.selectedCategory);
    return cat?.filterTags || [];
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
