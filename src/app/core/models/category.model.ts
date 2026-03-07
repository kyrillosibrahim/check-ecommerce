import { IBrand } from './brand.model';

export interface ISubcategory {
  id: number;
  name: string;
  slug: string;
  image: string;
}

export interface ICategory {
  id: number;
  name: string;
  slug: string;
  image: string;
  description: string;
  icon: string;           // Bootstrap icon class
  productCount: number;
  subcategories?: ISubcategory[];
  famousBrands?: IBrand[];
}
