<script lang="ts">
  import {
    Icon,
    Link,
    NavRight,
    NavTitle,
    Navbar,
    Page,
    Searchbar,
    Subnavbar,
    Tab,
    Tabs,
    Toolbar,
    f7ready,
    useStore,
  } from "framework7-svelte";
  import { onMount } from "svelte";
  import Contacts from "../contacts/pages/contacts.svelte";
  import { client } from "../pocketbase";
  import store, { mainRouter } from "../store";
  import Login from "../user/components/login.svelte";
  import { storable } from "../utils/storable";
  import Home from "./home.svelte";
  import Profile from "./profile.svelte";
  import { _ } from "svelte-i18n";

  export let f7router;
  $: $mainRouter = f7router

  let activeTab = storable("active-tab", 1);
  let showPreloader = true;
  let allowInfinite = true;

  let user = useStore(store, "user", (value) => {
    user = value;
  });

  const loadMore = () => {
    if ($activeTab !== 1) return;
    if (!allowInfinite) return;
    allowInfinite = false;
    store.dispatch("getMoreTransactions", {}).finally(() => {
      showPreloader = false;
      allowInfinite = true;
    });
  };

  onMount(() => {
    f7ready(() => {
      store.dispatch("getFirstTransactions", {}).finally(() => {
        showPreloader = false;
        allowInfinite = true;
      });

      store.dispatch("getContacts", {});
    });
  });

  const reload = () => {
    window.location.reload();
  };
</script>

<Page
  infinite
  infiniteDistance={50}
  infinitePreloader={showPreloader}
  onInfinite={loadMore}
  ptr
  onPtrRefresh={reload}
  class="p-0"
>
  {#if !user || !client.authStore.isValid}
    <Login />
  {:else}
    <Navbar>
      {#if $activeTab === 1}
        <NavTitle sliding>{$_("tab.1.title")}</NavTitle>
      {/if}
      {#if $activeTab === 2}
        <NavTitle>{$_("tab.2.title")}</NavTitle>
        <NavRight>
          <Link href="/contacts/create/" color="primary">
            <Icon material="add" />
          </Link>
        </NavRight>

        <Subnavbar>
          <Searchbar
            placeholder={$_("search")}
            searchContainer="#contact-list"
            searchIn=".item-title"
          />
        </Subnavbar>
      {/if}
      {#if $activeTab === 3}
        <NavTitle>{$_("tab.3.title")}</NavTitle>
      {/if}
    </Navbar>

    <Toolbar tabbar icons bottom>
      <Link
        on:click={() => activeTab.set(1)}
        tabLinkActive={$activeTab === 1}
        tabLink="#tab-1"
        iconIos="f7:house_fill"
        iconMd="material:home"
        text="Home"
      />
      <Link
        on:click={() => activeTab.set(2)}
        tabLinkActive={$activeTab === 2}
        tabLink="#tab-2"
        iconMaterial="people"
        text={$_("contacts")}
      />
      <Link
        on:click={() => activeTab.set(3)}
        tabLinkActive={$activeTab === 3}
        tabLink="#tab-3"
        iconMaterial="account_circle"
        text={$_("tab.3.title")}
      />
    </Toolbar>

    <Tabs class="p-0" swipeable>
      <Tab
        id="tab-1"
        tabActive={$activeTab === 1}
        onTabShow={() => activeTab.set(1)}
        class="page-content p-0"
      >
        <Home />
      </Tab>
      <Tab
        id="tab-2"
        tabActive={$activeTab === 2}
        onTabShow={() => activeTab.set(2)}
        class="page-content p-0"
      >
        <Contacts />
      </Tab>
      <Tab
        id="tab-3"
        tabActive={$activeTab === 3}
        onTabShow={() => activeTab.set(3)}
        class="page-content p-0"
      >
        <Profile />
      </Tab>
    </Tabs>
  {/if}
</Page>
