export type NotificationType = 'welcome' | 'order_created' | 'order_shipped' | 'coupon' | 'general';

export interface INotificationCoupon {
  code: string;
  discountPercentage: number;
  expiresAt: string;
}

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  coupon?: INotificationCoupon;
  read: boolean;
  createdAt: string;
}
