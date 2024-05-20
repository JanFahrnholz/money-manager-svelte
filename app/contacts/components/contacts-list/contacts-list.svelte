<script lang="ts">
    import {
        BlockTitle,
        List,
        ListItem,
        f7ready,
        useStore
    } from "framework7-svelte";
    import {onMount} from "svelte";
    import InfoPopover from "../../../components/info-popover.svelte";
    import store from "../../../store";
    import ContactListInfo from "./contact-list-info.svelte";
    import ContactsListItem from "./contacts-list-item.svelte";
    import SortDropdown from "../../../components/sort-dropdown.svelte"

    let contacts = useStore("contactsSorted", (value) => {
        internal = value.internal
        return (contacts = value);
    });
    let internal
    $:internal = contacts?.internal;

    let options = [
        {label: 'Sort by created asc', value: 'created'},
        {label: 'Sort by created desc', value: 'created', reverse: true},
        {label: 'Sort by name asc', value: 'name'},
        {label: 'Sort by name desc', value: 'name', reverse: true},
        {label: 'Sort by balance asc', value: 'balance'},
        {label: 'Sort by balance desc', value: 'balance', reverse: true},
        // Add more options as needed
    ];

    let selectedOption = 'Sort by created asc';

    $:{
        const option = options.find((option) => option.label === selectedOption);
        sortContacts(option.value, option?.reverse);
    }


    function sortContacts(sortBy, reverse = false) {
        const sorted = internal.sort((a, b) => {
            if (a[sortBy] < b[sortBy]) return -1;
            if (a[sortBy] > b[sortBy]) return 1;
            return 0;
        }) || [];

        if(reverse) sorted.reverse();

        internal = sorted
    }

    onMount(() => {
        f7ready(() => {
            store.dispatch("getContacts", {});
        });
    });
</script>

<div id="contact-list">
    <BlockTitle>
        Network IDs - {contacts.external.length}
        <InfoPopover key="network-contacts">
            // TODO: Add request allow deny feature
            These contacts represent your identity in the linked a network
            These user linked your id to their contacts and
            granted you access to their network.
        </InfoPopover>

    </BlockTitle>
    <List strong inset dividers>
        {#if contacts.external.length === 0}
            <ListItem title="No contacts yet" footer="share your ID"/>
        {/if}
        {#each contacts.external as contact (contact.id)}
            <ListItem
                    title={contact.owner}
                    after={`${contact.balance}€`}
                    link={`/contacts/${contact.id}/`}
            />
        {/each}
    </List>
    {#if contacts.couriers.length !== 0}
        <BlockTitle>Couriers - {contacts.couriers.length}</BlockTitle>

        <List strong inset dividers>
            {#each contacts.couriers as contact (contact.id)}
                <ContactsListItem {contact}/>
            {/each}
        </List>
    {/if}

    <BlockTitle
    >Your contacts - {contacts.internal.length}
        <ContactListInfo/>
    </BlockTitle>
    <SortDropdown {options} bind:selectedOption />
    <List strong inset dividers class="margin-top-half">
        {#each internal as contact (contact.id)}
            <ContactsListItem {contact}/>
        {/each}
    </List>
</div>
