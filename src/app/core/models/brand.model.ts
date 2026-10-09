export interface IBrand {
  id: number;
  name: string;
  slug: string;
  image: string;
  /** Wide image shown on the products page when filtering by this brand. */
  banner?: string;
}
