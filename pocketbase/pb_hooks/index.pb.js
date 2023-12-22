/// <reference path="../pb_data/types.d.ts" />

onAfterBootstrap((e) => {
    console.log("Pocketbase started!");
})

routerAdd("GET", "/transactions/:id/confirm", (c) => {
    const id = c.pathParam("id");
    const collection = $app.dao().findCollectionByNameOrId("transactions");
    const record = $app.dao().findRecordById("planned_transactions", id);
    const data  = record.schemaData()

    data.date = (new Date()).toISOString();
    const confirmed = new Record(collection, data)

    $app.dao().save(confirmed);
    $app.dao().delete(record)
    return c.json(200, confirmed)
})
