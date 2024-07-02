/// <reference path="../pb_data/types.d.ts" />

const { isRedeem } = require("./utils");

/**
 *
 * @param {core.RecordsListEvent} data
 * @param {*} helper
 */
const validateListRequest = (data, helper) => {
  const { authRecord, admin } = $apis.requestInfo(data.httpContext);
  if (admin) return data;

  data.records.filter((item) => {
    $app.dao().expandRecord(item, ["contact"]);
    let contact = item.expandedOne("contact");

    const manager = $app
      .dao()
      .findFirstRecordByData("contacts", "courier", item.get("courier"));
    if (manager.get("owner") !== contact.get("owner")) {
      return false;
    }

    if (authRecord.getId() !== contact.get("owner")) {
      return false;
    }

    return true;
  });

  return data;
};

/**
 *
 * @param {core.RecordCreateEvent} data
 * @param {*} helper
 */
const validateCreateRequest = (data, helper) => {
  const { isExpense, isInvoice, isRefund, isCollect } = helper.utils;

  const { authRecord, admin } = $apis.requestInfo(data.httpContext);
  if (admin) return true;

  $app.dao().expandRecord(data.record, ["contact", "courier"]);
  let contact = data.record.expandedOne("contact");
  $app.dao().expandRecord(contact, ["courier"]);
  let transactionCourier = data.record.expandedOne("courier");
  let contactCourier = contact.expandedOne("courier");

  const amount = data.record.getInt("amount");

  if (authRecord?.getId() !== contact.get("owner") && !transactionCourier) {
    throw new ForbiddenError("You are not the owner of the contact");
  }

  if (transactionCourier && contactCourier) {
    throw new BadRequestError(
      "Cannot create courier transactions on courier contacts"
    );
  }

  if (transactionCourier) {
    const manager = $app
      .dao()
      .findFirstRecordByData("contacts", "courier", transactionCourier.getId());
    if (manager.get("owner") !== contact.get("owner")) {
      throw new ForbiddenError("You are not allowed to courier this contact");
    }

    if (
      isExpense(data.record) ||
      isInvoice(data.record) ||
      isRefund(data.record)
    ) {
      throw new ForbiddenError("Couriers can only create Income Transactions");
    }
    const inventory = transactionCourier.getInt("inventoryBalance");
    if (inventory - amount < 0) {
      throw new BadRequestError(
        `Your inventory balance is too low: ${inventory}`
      );
    }
  }

  if(isRedeem(data.record)){
    if (contactCourier.getInt("bonusBalance") - amount < 0) {
      throw new ApiError(500, "Cannot create transaction", {
        salesBalance: new ValidationError(
          "bonusBalanceTooLow",
          `The amount you try to redeem (${amount}) is higher than couriers bonus balance (${contactCourier.get(
            "bonusBalance"
          )})`
        ),
      });
    }
  }

  if (isCollect(data.record)) {
    if (contactCourier.getInt("salesBalance") - amount < 0) {
      throw new ApiError(500, "Cannot create transaction", {
        salesBalance: new ValidationError(
          "salesBalanceTooLow",
          `Transaction amount (${amount}) is higher than couriers sales balance (${contactCourier.get(
            "salesBalance"
          )})`
        ),
      });
    }
  }
};

/**
 *
 * @param {{
 * transaction: models.Model
 * contact: models.Record
 * dao: daos.Dao
 * }} params
 * @param {*} helper
 */
const onCreate = ({ transaction, contact, dao, reverse = false }, helper) => {
  const {
    isIncome,
    isExpense,
    isInvoice,
    isRefund,
    isCollect,
    isRestock,
    pushContactHistory,
    modifyBalance,
  } = helper.utils;

  dao.runInTransaction((dao) => {
    dao.expandRecord(contact, ["courier", "owner"]);
    let tCourier = !!transaction.get("courier")
      ? dao.findRecordById("couriers", transaction.get("courier"))
      : null;
    let cCourier = contact.expandedOne("courier");
    let owner = contact.expandedOne("owner");
    const amount = +transaction.get("amount") * (reverse ? -1 : 1);

    if(isIncome(transaction)){
      owner = modifyBalance(owner, amount);
    }

    if(isExpense(transaction)){
      owner = modifyBalance(owner, -amount);
    }

    if (isInvoice(transaction)) {
      contact = modifyBalance(contact, -amount);
      contact = pushContactHistory(contact);
    }
    if (isRefund(transaction)) {
      contact = modifyBalance(contact, amount);
      contact = pushContactHistory(contact);
      owner = modifyBalance(owner, amount);
    }
    dao.saveRecord(contact);
    dao.saveRecord(owner);

    if (isRestock(transaction) && cCourier) {
      cCourier = modifyBalance(cCourier, amount, "inventoryBalance");
      dao.saveRecord(cCourier);
    }

    if (isCollect(transaction) && cCourier) {
      cCourier = modifyBalance(cCourier, -amount, "salesBalance");
      dao.saveRecord(cCourier);
    }

    if (isRedeem(transaction) && cCourier) {
      cCourier = modifyBalance(cCourier, -amount, "bonusBalance");
      dao.saveRecord(cCourier);
    }

    if (isIncome(transaction) && tCourier) {
      tCourier = modifyBalance(tCourier, amount, "salesBalance");
      tCourier = modifyBalance(tCourier, amount, "totalSales");
      tCourier = modifyBalance(tCourier, -amount, "inventoryBalance");
      tCourier = modifyBalance(
        tCourier,
        amount * (tCourier.getInt("bonusPercentage") / 100),
        "bonusBalance"
      );
      dao.saveRecord(tCourier);
    }
  });
};

/**
 *
 * @param {{
 * transaction: models.Model
 * contact: models.Record
 * dao: daos.Dao
 * }} params
 * @param {*} helper
 */
const onDelete = ({ transaction, contact, dao }, helper) => {
  onCreate({ transaction, contact, dao, reverse: true }, helper);
};

module.exports = {
  validateListRequest,
  validateCreateRequest,
  onCreate,
  onDelete,
};
