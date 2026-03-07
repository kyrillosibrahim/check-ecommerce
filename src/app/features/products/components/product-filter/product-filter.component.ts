import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ICategory } from '../../../../core/models/category.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-product-filter',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './product-filter.component.html',
  styleUrl: './product-filter.component.scss'
})
export class ProductFilterComponent {
  @Input() categories: ICategory[] = [];
  @Input() selectedCategory = '';
  @Input() sortBy = 'default';
  @Input() searchTerm = '';

  @Output() categoryChange = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<string>();
  @Output() searchChange = new EventEmitter<string>();

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchChange.emit(value);
  }
}
