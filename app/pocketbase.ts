import PocketBase from "pocketbase";

const url = "http://localhost:8090";
const client = new PocketBase(url);
client.autoCancellation(false);

const getClientId = () => client.authStore.model?.id;

export { client, getClientId };
