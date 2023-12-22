import PocketBase from "pocketbase";

const url = "http://localhost:8090";

console.log(url)
const client = new PocketBase(url);
client.autoCancellation(false);

const clientId = client.authStore.model?.id;

export { client, clientId };
