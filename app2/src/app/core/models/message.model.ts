export interface ChatMessage {
  id: string;
  pairId: string;
  sender: string;
  text: string;
  orderId: string;
  read: boolean;
  created: string;
}
