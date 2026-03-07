import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { TranslationService } from '../../../../core/services/translation.service';

@Component({
  selector: 'app-pagination',
  imports: [],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss'
})
export class PaginationComponent {
  translationService = inject(TranslationService);
  @Input({ required: true }) currentPage = 1;
  @Input({ required: true }) totalPages = 1;
  @Output() pageChange = new EventEmitter<number>();

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }
}
