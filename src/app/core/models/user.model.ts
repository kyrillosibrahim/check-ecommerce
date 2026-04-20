export interface IUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'user' | 'admin';
  addresses?: IAddress[];
  createdAt?: string;
  token?: string;
}

export interface IOrder {
  id: string;
  items: { productId: string; title: string; titleAr?: string; quantity: number; price: number }[];
  total: number;
  shippingCost: number;
  shippingAddress: IAddress;
  shippingCompany?: string;
  paymentMethod?: 'cod' | 'instapay';
  notes?: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
}

export interface IAddress {
  fullName: string;
  phone: string;
  governorate: string;
  city: string;
  district?: string;
  address: string;
}
