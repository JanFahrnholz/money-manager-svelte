export type OrderStatus = 'open' | 'accepted' | 'packaged' | 'delivered';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  contactId: string;
  agentLinkId: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  created: string;
  updated: string;
}
