import PocketBase from "pocketbase";

const url =
  process.env.NODE_ENV === "production"
    ? "https://pb.industed.com"
    : "https://pb-staging.industed.com";

const client = new PocketBase(url);
client.autoCancellation(false);

const clientId = client.authStore.model?.id;

export { client, clientId };
