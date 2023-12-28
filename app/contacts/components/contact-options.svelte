<script>
    import {
        BlockTitle,
        List,
        ListButton,
        f7,
        useStore,
    } from "framework7-svelte";
    import store from "../../store";
    import {tick} from "svelte";

    export let contact;
    export let settings = contact.settings;

    let user = useStore("user", (v) => (user = v));
    let showStatistics;

    $: {
        showStatistics = user.settings?.showContactStatistics

        if (settings?.showContactStatistics !== undefined) {
            showStatistics = settings?.showContactStatistics;
        }
    }


    const changeShowStatistics = () => {

        f7.dialog.create({
            title: "statistics visibility",
            closeByBackdropClick: true,
            buttons: [
                {
                    text: "show",
                    color: "blue",
                    onClick: () => {
                        store
                            .dispatch("updateContact", {
                                ...contact,
                                settings: {
                                    ...contact.settings,
                                    showContactStatistics: true,
                                },
                            })
                            .then((updated) => {
                                settings = {...settings, ...updated.settings};
                            })
                    }
                },
                {
                    text: "hide",
                    color: "blue",
                    onClick: () => {
                        store
                            .dispatch("updateContact", {
                                ...contact,
                                settings: {
                                    ...contact.settings,
                                    showContactStatistics: false,
                                },
                            })
                            .then((updated) => {
                                settings = {...settings, ...updated.settings};
                            })
                    }
                },
                {
                    text: `default`,
                    color: "blue",
                    onClick: () => {
                        store
                            .dispatch("updateContact", {
                                ...contact,
                                settings: {
                                    ...contact.settings,
                                    showContactStatistics: "default",
                                },
                            })
                            .then((updated) => {
                                settings = {...settings, ...updated.settings};

                            })
                        tick()
                    }
                }
            ],
            verticalButtons: true
        }).open()


    };

    const confirmUpdate = (message, data) => {
        f7.dialog
            .confirm(message, () => {
                store
                    .dispatch("updateContact", {
                        ...contact,
                        ...data,
                    })
                    .then((updated) => (contact = updated));
            })
            .setTitle("Are you sure?");
    };

    const deleteContact = () => {
        f7.dialog.confirm(
            `All transactions for this contact will be deleted as well`,
            `Are you sure?`,
            () => {
                store.dispatch("deleteContact", contact.id).then(() => f7router.back());
            }
        );
    };

    const removeCourier = () => {
        confirmUpdate(
            "This user won't be able to create transactions for your contacts anymore.",
            {
                courier: false,
            }
        );
    };

    const addCourier = () => {
        confirmUpdate(
            "This user will be able to create transactions for your contacts.",
            {
                courier: true,
            }
        );
    };

    const removeLink = () => {
        confirmUpdate(
            "The user won't be able to see their transactions anymore. ",
            {
                user: "",
            }
        );
    };

    const addLink = () => {
        f7.dialog.prompt("Add user id", (user) => {
            if (user === "") return;
            store
                .dispatch("updateContact", {
                    ...contact,
                    user,
                })
                .then((updated) => (contact = updated));
        });
    };
</script>

<BlockTitle>Options</BlockTitle>
<List strong inset dividers>
    {#if contact.user === ""}
        <ListButton on:click={addLink} title="link user id" color="blue"/>
    {:else}
        <ListButton
                on:click={changeShowStatistics}
                title={`statistics visibility`}
                color="blue"
        />

        {#if contact.courier}
            <ListButton on:click={removeCourier} title="remove courier" color="red"/>
        {:else}
            <ListButton on:click={addCourier} title="make courier" color="blue"/>
            <ListButton on:click={removeLink} title="remove link" color="red"/>
        {/if}
    {/if}

    <ListButton on:click={deleteContact} title="delete contact" color="red"/>
</List>
