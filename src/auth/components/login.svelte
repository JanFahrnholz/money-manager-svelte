<script lang="ts">
  import {
    Button,
    Link,
    List,
    ListInput,
    Preloader,
    useStore,
    f7
  } from "framework7-svelte";
  import { client } from "../../pocketbase";
  import store, { alerts } from "../../store";
  import Alerts from "../../components/alerts.svelte";


  let open = true;
  let loading = false;
  let username = "";
  let password = "";
  let toastTop;

  let user = useStore("user", (value) => {
    console.log("🚀 ~ user changed", value);
    open = value === null ? true : false;
    return (user = value);
  });

  const login = async () => {
    loading = true;
    try {
      await store.dispatch("login", { username, password });
    } catch (error) {
      showToastTop(error.message)
    } finally {
      loading = false;
    }
  };

  const handleKeydown =(e)=> {
    if(e.key === "Enter") login();
  }

  function showToastTop(text) {
    // Create toast
    if (!toastTop) {
      toastTop = f7.toast.create({
        text,
        position: 'top',
        closeTimeout: 2000,
      });
    }
    // Open it
    toastTop.open();
  }

</script>

<div style="height: 14rem;" />
<div class="block-title-large text-white text-center">Login</div>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div on:keydown={handleKeydown}>
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
</div>
<Alerts/>
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
