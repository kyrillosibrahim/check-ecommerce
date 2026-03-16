
export interface ISlide {
  title: string;
  subtitle: string;
  image: string;
  ctaText: string;
  ctaLink: string;
}

export const SLIDES_DATA: ISlide[] = [
  {
    title: 'Now',
    subtitle: 'Discover our latest collection of premium products curated just for you',
    image: '../../../../assets/baners/New folder/1.png',
    ctaText: 'Shop Now',
    ctaLink: '/products'
  },
  {
    title: 'Summer Sale',
    subtitle: 'Up to 50% off on selected items — limited time only',
    image: '../../../../assets/baners/New folder/2.png',
    ctaText: 'View Deals',
    ctaLink: '/products'
  },

];
