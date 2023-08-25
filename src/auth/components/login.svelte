<script lang="ts">
  import {
    Button,
    Link,
    List,
    ListInput,
    Preloader,
    useStore,
  } from "framework7-svelte";
  import { client } from "../../pocketbase";
  import store from "../../store";

  let open = true;
  let loading = false;
  let username = "";
  let password = "";
  let error = "";

  let user = useStore("user", (value) => {
    console.log("🚀 ~ user changed", value);
    open = value === null ? true : false;
    return (user = value);
  });

  const login = async () => {
    loading = true;
    try {
      await store.dispatch("login", { username, password });
      error = "";
      window.location.reload();
    } catch (error) {
      error = error.message;
    } finally {
      loading = false;
    }
  };

  client.authStore.onChange((user) => {
    console.log(user, "onc");
  });
</script>

<div style="height: 16rem;" />
<div class="block-title-large text-white text-center">Login</div>
<List strong inset dividers>
  <ListInput
    type="text"
    name="username"
    placeholder="Your ID"
    bind:value={username}
  />
  <ListInput
    type="password"
    name="password"
    placeholder="Your password"
    bind:value={password}
  />
</List>
{error}
<p class="grid grid-cols-1 grid-gap" style="padding: 4rem">
  <Button large fill on:click={login}>
    {#if loading}
      <Preloader />
    {:else}
      Login
    {/if}
  </Button>
  <Link href="/create-id/">no account? create one</Link>
</p>
