import { BaseAuthStore } from "pocketbase";

export type User = BaseAuthStore & {
  username: string;
  verified: boolean;
  emailVisibility: boolean;
  email: string;
  balance: number;
  enablePrivacyMode: boolean;
  enableTransactionsTab: boolean;
  enableChats: boolean;
  enableInsights: boolean;
};
