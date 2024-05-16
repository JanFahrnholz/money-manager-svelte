
/**
 * 
 * @param {models.Record} contact 
 */
const pushContactHistory = (contact) => {
    const balance = contact.getInt("balance");
    const statistics = JSON.parse(contact.get("statistics"))

    statistics.balanceHistory.push({
        date: new Date().toISOString(),
        balance
    })

    contact.set("statistics", JSON.stringify(statistics))
    $app.dao().saveRecord(contact)
}

module.exports = {
    pushContactHistory
}