import { Record } from "pocketbase";

export type Contact = Record & {
  id: string;
  name: string;
  balance: number;
  user: string;
  owner: string;
};
