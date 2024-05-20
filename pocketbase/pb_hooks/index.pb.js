/// <reference path="../pb_data/types.d.ts" />

onAfterBootstrap((e) => {
  console.log("Pocketbase started!");
});

routerAdd(
  "GET",
  "/:owner/planned_transactions/:id/confirm",
  (c) => {
    const id = c.pathParam("id");

    $app.dao().runInTransaction((txDao) => {
      const collection = txDao.findCollectionByNameOrId("transactions");
      const record = txDao.findRecordById("planned_transactions", id);
      const confirmed = new Record(collection, record.schemaData());
      console.log(confirmed);
      confirmed.set("date", new Date().toISOString());

      txDao.save(confirmed);
      txDao.delete(record);
    });

    return c.json(200, { success: true });
  },
  $apis.activityLogger($app),
  $apis.requireAdminOrOwnerAuth("owner")
);

onRecordBeforeCreateRequest((c) => {
  const { isInvoice, isRefund, modifyBalance } = require(`${__hooks}/utils.js`);
  const { pushContactHistory } = require(`${__hooks}/statistics.js`);

  const id = c.record.get("contact");
  const contact = $app.dao().findRecordById("contacts", id);
  const amount = c.record.getInt("amount");
  console.log("===================== CREATE T", JSON.stringify(contact));
  if (isInvoice(c.record)) {
    modifyBalance(contact, -amount);
    pushContactHistory(contact);
  }
  if (isRefund(c.record)) {
    modifyBalance(contact, amount);
    pushContactHistory(contact);
  }

}, "transactions");

onRecordBeforeDeleteRequest((c) => {
    const {admin} = $apis.requestInfo(c.httpContext)
    if(admin) return true
  const { isInvoice, isRefund } = require(`${__hooks}/utils.js`);
  const id = c.record.get("contact");
  const contact = $app.dao().findRecordById("contacts", id);
  const amount = c.record.getInt("amount");

  if (isInvoice(c.record)) {
    modifyBalance(contact, amount);
  }
  if (isRefund(c.record)) {
    modifyBalance(contact, -amount);
  }
}, "transactions");

// =========== CONTACTS ===========

onRecordBeforeCreateRequest((c) => {
  const { ensureContactStatistics } = require(`${__hooks}/statistics.js`);

  c.record = ensureContactStatistics(c.record);

  $app.dao().saveRecord(c.record);
}, "contacts");

onRecordsListRequest((c) => {
  const { calculateContactScore } = require(`${__hooks}/statistics.js`);

  c.result.items = c.result.items.map((item) => {
    item.withUnknownData(true);
    item.set("score", calculateContactScore(item));

    return item;
  });

  c.httpContext.json(200, JSON.parse(JSON.stringify(c.result)));
}, "contacts");

onRecordViewRequest((c) => {
  const {
    calculateContactScore,
    ensureContactStatistics,
  } = require(`${__hooks}/statistics.js`);

  c.record = ensureContactStatistics(c.record, true);
  $app.dao().expandRecord(c.record, ["statistics"]);
  c.record.withUnknownData(true);
  c.record.set("score", calculateContactScore(c.record));
  console.log(c.record, JSON.stringify(c.record))

  c.httpContext.json(200, JSON.parse(JSON.stringify(c.record)));
}, "contacts");

routerAdd("GET", "/contact/:id/score", (c) => {
  const id = c.pathParam("id");
  const contact = $app.dao().findRecordById("contacts", id);
  const { calculateContactScore } = require(`${__hooks}/utils.js`);

  return c.json(200, { score: calculateContactScore(contact) });
});

cronAdd("save-total-contact-balance-history", "0 */4 * * *", () => {
  const stats = $app.dao().findRecordsByFilter("statistics", ``);
});
