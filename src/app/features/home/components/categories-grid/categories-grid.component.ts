import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ICategory } from '../../../../core/models/category.model';

@Component({
  selector: 'app-categories-grid',
  imports: [RouterLink],
  templateUrl: './categories-grid.component.html',
  styleUrl: './categories-grid.component.scss'
})
export class CategoriesGridComponent {
  @Input({ required: true }) categories: ICategory[] = [];
}
