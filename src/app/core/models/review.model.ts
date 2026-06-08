export interface IReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved';
  createdAt?: string;
  updatedAt?: string;
}
