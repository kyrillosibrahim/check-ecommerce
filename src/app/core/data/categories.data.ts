import { ICategory } from '../models/category.model';

export const CATEGORIES_DATA: ICategory[] = [
  {
    id: 1,
    name: 'Electronics',
    slug: 'electronics',
    image: 'https://picsum.photos/seed/cat-electronics/400/300',
    description: 'Latest gadgets, audio gear, and tech accessories',
    icon: 'bi-cpu',
    productCount: 4
  },
  {
    id: 2,
    name: 'Clothing',
    slug: 'clothing',
    image: 'https://picsum.photos/seed/cat-clothing/400/300',
    description: 'Fashion essentials for every occasion',
    icon: 'bi-bag',
    productCount: 3
  },
  {
    id: 3,
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    image: 'https://picsum.photos/seed/cat-home/400/300',
    description: 'Everything you need for a comfortable home',
    icon: 'bi-house',
    productCount: 3
  },
  {
    id: 4,
    name: 'Sports',
    slug: 'sports',
    image: 'https://picsum.photos/seed/cat-sports/400/300',
    description: 'Fitness equipment and outdoor gear',
    icon: 'bi-trophy',
    productCount: 3
  },
  {
    id: 5,
    name: 'Vitamins',
    slug: 'Vitamins',
    image: '../../../assets/baners/vitaminbg.png',
    description: 'Health and Vitamins',
    icon: 'bi-book',
    productCount: 12
  },
  {
    id: 6,
    name: 'Accessories',
    slug: 'accessories',
    image: 'https://picsum.photos/seed/cat-accessories/400/300',
    description: 'Premium accessories to complete your look',
    icon: 'bi-watch',
    productCount: 2
  }
];
