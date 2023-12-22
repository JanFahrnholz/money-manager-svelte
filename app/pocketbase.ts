import PocketBase from "pocketbase";

const url = "https://pb.industed.com";

console.log(url)
const client = new PocketBase(url);
client.autoCancellation(false);

const clientId = client.authStore.model?.id;

export { client, clientId };
