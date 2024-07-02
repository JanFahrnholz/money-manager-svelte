/// <reference path="../pb_data/types.d.ts" />

onAfterBootstrap((e) => {
  console.log("Pocketbase started!");
});

// ================= USERS =================

onRecordAfterCreateRequest((c) => {
  const info = $apis.requestInfo(c.httpContext);
  if (!info.data?.username) {
    c.record.setUsername(c.record.getId());
  }

  console.log(
    JSON.stringify(info),
    c.record.getString("username"),
    c.record.getId()
  );
  $app.dao().saveRecord(c.record);
}, "users");

// ================= PLANNED TRANSACTIONS =================

routerAdd(
  "POST",
  "/planned_transactions/:id/confirm",
  (c) => {
    const id = c.pathParam("id");

    $app.dao().runInTransaction((txDao) => {
      const collection = txDao.findCollectionByNameOrId("transactions");
      const record = txDao.findRecordById("planned_transactions", id);

      const confirmed = new Record(collection, record.schemaData());
      confirmed.set("date", new Date().toISOString());

      txDao.saveRecord(confirmed);
      txDao.delete(record);
    });

    return c.json(200, { success: true });
  },
  $apis.activityLogger($app),
  $apis.requireAdminOrRecordAuth("users")
);

// ================= TRANSACTIONS =================

onRecordsListRequest((c) => {
  const utils = require(`${__hooks}/utils.js`);
  const { validateListRequest } = require(`${__hooks}/transactions.js`);

  // c = validateListRequest(c, { utils })
}, "transactions");

onRecordBeforeCreateRequest((c) => {
  const utils = require(`${__hooks}/utils.js`);
  const { validateCreateRequest } = require(`${__hooks}/transactions.js`);

  validateCreateRequest(c, { utils });
}, "transactions");

onModelBeforeCreate((e) => {
  const utils = require(`${__hooks}/utils.js`);
  const { onCreate } = require(`${__hooks}/transactions.js`);
  utils.pushContactHistory = require(`${__hooks}/statistics.js`).pushContactHistory;
  const id = e.model.get("contact");
  const contact = e.dao.findRecordById("contacts", id);

  onCreate({
    transaction: e.model,
    contact,
    dao: e.dao,
  }, { utils })

}, "transactions");

onModelBeforeDelete((e) => {
  const utils = require(`${__hooks}/utils.js`);
  const { onDelete } = require(`${__hooks}/transactions.js`);
  utils.pushContactHistory = require(`${__hooks}/statistics.js`).pushContactHistory;
  const id = e.model.get("contact");
  const contact = e.dao.findRecordById("contacts", id);

  onDelete({
    transaction: e.model,
    contact,
    dao: e.dao,
  }, { utils })

}, "transactions");

onRecordBeforeDeleteRequest((c) => {
  const { admin } = $apis.requestInfo(c.httpContext);
  if (admin) return true;
}, "transactions");

// ================= CONTACTS =================

onRecordBeforeCreateRequest((c) => {
  const { ensureContactStatistics } = require(`${__hooks}/statistics.js`);

  c.record = ensureContactStatistics(c.record);

  $app.dao().saveRecord(c.record);
}, "contacts");

onRecordsListRequest((c) => {
  if (c.httpContext.get("admin")) return null; // ignore for admins

  const { calculateContactScore } = require(`${__hooks}/statistics.js`);

  c.result.items = c.result.items.map((item) => {
    $app.dao().expandRecord(item, ["courier", "statistics"]);
    item.withUnknownData(true);
    item.set("score", calculateContactScore(item));

    return item;
  });

  c.httpContext.json(200, JSON.parse(JSON.stringify(c.result)));
}, "contacts");

onRecordViewRequest((c) => {
  if (c.httpContext.get("admin")) return null; // ignore for admins

  const {
    calculateContactScore,
    ensureContactStatistics,
  } = require(`${__hooks}/statistics.js`);

  c.record = ensureContactStatistics(c.record, true);
  $app.dao().expandRecord(c.record, ["courier", "statistics", "owner"]);
  c.record.withUnknownData(true);
  c.record.set("score", calculateContactScore(c.record));

  c.httpContext.json(200, JSON.parse(JSON.stringify(c.record)));
}, "contacts");

routerAdd(
  "GET",
  "/contact/:id/score",
  (c) => {
    const id = c.pathParam("id");
    const contact = $app.dao().findRecordById("contacts", id);
    const { calculateContactScore } = require(`${__hooks}/utils.js`);

    return c.json(200, { score: calculateContactScore(contact) });
  },
  $apis.activityLogger($app),
  $apis.requireAdminOrRecordAuth("users")
);

routerAdd(
  "POST",
  "/contact/:id/edit-linked-name",
  (c) => {
    const id = c.pathParam("id");
    const name = $apis.requestInfo(c).data.linkedName;
    const contact = $app.dao().findRecordById("contacts", id);
    contact.set("linkedName", name);

    $app.dao().saveRecord(contact);
    $app.dao().expandRecord(contact, ["courier", "statistics", "owner"]);

    return c.json(200, { contact });
  },
  $apis.activityLogger($app),
  $apis.requireAdminOrRecordAuth("users")
);

// ================= COURIERS =================

routerAdd(
  "POST",
  "/contact/:id/make-courier",
  (c) => {
    const id = c.pathParam("id");
    let data;

    $app.dao().runInTransaction((dao) => {
      const contact = dao.findRecordById("contacts", id);
      dao.expandRecord(contact, ["owner"]);
      const owner = contact.expandedOne("owner");
      const collection = dao.findCollectionByNameOrId("couriers");
      const courier = new Record(collection, {
        inventoryBalance: 0,
        salesBalance: 0,
        user: contact.get("user"),
      });
      dao.saveRecord(courier);

      contact.set("courier", courier.getId());
      owner.set("couriers", [...owner.get("couriers"), courier.getId()]);

      dao.saveRecord(contact);
      dao.saveRecord(owner);
      data = contact;
    });

    return c.json(200, data);
  },
  $apis.activityLogger($app),
  $apis.requireAdminOrRecordAuth("users")
);

routerAdd(
  "POST",
  "/contact/:id/remove-courier",
  (c) => {
    const id = c.pathParam("id");
    let data;

    $app.dao().runInTransaction((dao) => {
      const contact = dao.findRecordById("contacts", id);
      dao.expandRecord(contact, ["owner", "courier"]);
      const courier = contact.expandedOne("courier");
      const owner = contact.expandedOne("owner");

      if (courier.getInt("inventoryBalance") > 0) {
        throw new BadRequestError("Cannot remove courier", {
          inventoryBalance: new ValidationError(
            "inventoryBalance",
            "Courier has inventory balance"
          ),
        });
      }
      if (courier.getInt("salesBalance") > 0) {
        throw new BadRequestError("Cannot remove courier", {
          salesBalance: new ValidationError(
            "salesBalance",
            "Courier has sales balance to collect"
          ),
        });
      }
      if (courier.getInt("bonusBalance") > 0) {
        throw new BadRequestError("Cannot remove courier", {
          bonusBalance: new ValidationError(
            "bonusBalance",
            "Courier has bonus balance"
          ),
        });
      }

      owner.set(
        "couriers",
        owner.get("couriers").filter((id) => id !== courier.getId())
      );
      contact.set("courier", null);

      dao.saveRecord(owner);
      dao.saveRecord(contact);
      dao.deleteRecord(courier);
      data = contact;
    });

    return c.json(200, data);
  },
  $apis.activityLogger($app),
  $apis.requireAdminOrRecordAuth("users")
);

$app.rootCmd.addCommand(
  new Command({
    use: "purge-users",
    run: (cmd, args) => {
      $app.dao().runInTransaction((dao) => {
        const result = arrayOf(
          new DynamicModel({id: ""})
        );
        try {
          dao
            .db()
            .select("users.id", "users.username")
            .from("users")
            .join(
              "LEFT OUTER JOIN",
              "contacts",
              $dbx.or(
                $dbx.exp("contacts.owner = users.id"),
                $dbx.exp("contacts.user = users.id")
              )
            )
            .groupBy("users.id")
            .having($dbx.exp("count(contacts.id) = 0"))
            .all(result);
            result.forEach((item) => dao.db().delete("users", $dbx.exp("users.id={:id}", { id: item.id })).execute());
            console.log(JSON.stringify(result));
        } catch (error) {
          console.log(error)
        }
      });
    },
  })
);
