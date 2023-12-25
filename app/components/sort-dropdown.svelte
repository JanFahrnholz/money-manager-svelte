<script>
    import {List, ListItem} from "framework7-svelte";
    import {createEventDispatcher} from "svelte";

    export let options;
    export let selectedOption;

    const dispatch = createEventDispatcher();

    function handleSortChange(event) {
        const selectedValue = event.target.value;
        selectedOption = selectedValue;
        // Emit an event to notify the parent component about the selected option
        dispatch('sortChange', selectedValue);
    }
</script>

<style>
    /* Add your styles here */
</style>
<List strong outline dividers inset class="margin-bottom-half">
    <ListItem title="Sort by" smartSelect smartSelectParams={{ openIn: 'popover' }}>
        <select bind:value={selectedOption} on:change={handleSortChange}>
            {#each options as option (option)}
                <option value={option.label}>{option.label}</option>
            {/each}
        </select>
    </ListItem>
</List>