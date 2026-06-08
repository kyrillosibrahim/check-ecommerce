export interface IReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved';
  verifiedPurchase?: boolean;
  helpfulCount?: number;
  helpfulByMe?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
