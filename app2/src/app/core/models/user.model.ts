export interface User {
  id: string;
  username: string;
  balance: number;
  settings: Record<string, any>;
  language: string;
  created: string;
  updated: string;
}
