import PocketBase from "pocketbase";

const client = new PocketBase("https://pb-staging.industed.com");
client.autoCancellation(false);

const clientId = client.authStore.model?.id;

export { client, clientId };
