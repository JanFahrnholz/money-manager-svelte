<script lang="ts">
  import {
    Icon,
    Link,
    NavRight,
    NavTitle,
    NavTitleLarge,
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
  import Home from "./home.svelte";
  import Contacts from "./contacts/contacts.svelte";
  import Profile from "./profile.svelte";
  import store from "../store";
  import { onMount } from "svelte";
  import { storable } from "../utils/storable";
  import Login from "../user/components/login.svelte";

  export let f7router;
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
    store.dispatch("loadMoreTransactions", {}).finally(() => {
      showPreloader = false;
      allowInfinite = true;
    });
  };

  onMount(() => {
    f7ready(() => {
      store.dispatch("loadFirstTransactions", {}).finally(() => {
        showPreloader = false;
        allowInfinite = true;
      });
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
  {#if !user}
    <Login />
  {:else}
    <Navbar>
      {#if $activeTab === 1}
        <NavTitle sliding>MoneyManager</NavTitle>
      {/if}
      {#if $activeTab === 2}
        <NavTitle>Contacts</NavTitle>
        <NavRight>
          <Link href="/contacts/create/" color="primary">
            <Icon material="add" />
          </Link>
        </NavRight>
        <Subnavbar>
          <Searchbar searchContainer="#contact-list" searchIn=".item-title" />
        </Subnavbar>
      {/if}
      {#if $activeTab === 3}
        <NavTitle>Profile</NavTitle>
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
        text="Contacts"
      />
      <Link
        on:click={() => activeTab.set(3)}
        tabLinkActive={$activeTab === 3}
        tabLink="#tab-3"
        iconMaterial="account_circle"
        text="Profile"
      />
    </Toolbar>

    <Tabs class="p-0">
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
        <br />
        <br />
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
