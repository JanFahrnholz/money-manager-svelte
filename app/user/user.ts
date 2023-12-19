import { BaseAuthStore } from "pocketbase";

export class User extends BaseAuthStore {
  username: string;
  verified: boolean;
  emailVisibility: boolean;
  email: string;
  balance: number;
  enablePrivacyMode: boolean;
  enableTransactionsTab: boolean;
  enableChats: boolean;
  enableInsights: boolean;
  settings: {
    showContactStatistics: boolean
  }
};
