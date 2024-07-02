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
  import { _ } from "svelte-i18n";
  import { ApiError } from "../../utils/errors";


  let open = true;
  let loading = false;
  let username = "";
  let password = "";
  let toastTop;

  let user = useStore("user", (value) => {
    open = value === null ? true : false;
    return (user = value);
  });

  const login = async () => {
    loading = true;
    try {
      await store.dispatch("login", { username, password });
    } catch (error) {
      showToastTop(error.message)
      new ApiError(error).dialog()
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

<div style="height: 33%;" />
<div class="block-title-large text-white text-center">{$_("page.login.title")}</div>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div on:keydown={handleKeydown}>
  <List strong inset dividers>
    <ListInput
    type="text"
    name="username"
    placeholder={$_("page.login.placeholder-1")}
    bind:value={username}
    />
    <ListInput
    type="password"
    name="password"
    placeholder={$_("page.login.placeholder-2")}
    bind:value={password}
    />
  </List>
</div>

<p class="grid grid-cols-1 grid-gap" style="padding: 4rem">
  <Button large fill textColor="black" on:click={login}>
    {#if loading}
      <Preloader />
    {:else}
      {$_("page.login.submit")}
    {/if}
  </Button>
  <Link href="/create-id/">{$_("page.login.register")}</Link>
</p>
