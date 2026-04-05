import Database from 'better-sqlite3';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DB_PATH = resolve(__dirname, '../../pb_backup_money_manager_20260405112424/data.db');
const OUTPUT_PATH = resolve(__dirname, '../src/assets/migration-data.json');
const MY_USER_ID = '4eybcx2m5nv3pfa';

const TYPE_MAP = {
  'Einnahme': 'Income',
  'Ausgabe': 'Expense',
  'Rechnung': 'Invoice',
  'Rückzahlung': 'Refund',
  'Income': 'Income',
  'Expense': 'Expense',
  'Invoice': 'Invoice',
  'Refund': 'Refund',
  'Restock': 'Restock',
  'Collect': 'Collect',
  'Redeem': 'Redeem',
};

const db = new Database(DB_PATH, { readonly: true });

// Read contacts owned by the user
const contacts = db.prepare(`
  SELECT id, name, linkedName, balance, owner, created, updated
  FROM contacts WHERE owner = ?
`).all(MY_USER_ID).map(c => ({
  id: c.id,
  name: c.name || '',
  linkedName: c.linkedName || '',
  balance: c.balance || 0,
  owner: MY_USER_ID,
  user: '',
  statistics: '',
  score: 0,
  created: c.created,
  updated: c.updated,
  synced: 0,
}));

console.log(`Contacts: ${contacts.length}`);

// Read transactions by the user
const transactions = db.prepare(`
  SELECT id, amount, info, date, type, contact, owner, created, updated
  FROM transactions WHERE owner = ?
`).all(MY_USER_ID).map(t => ({
  id: t.id,
  amount: t.amount || 0,
  info: t.info || '',
  date: t.date,
  type: TYPE_MAP[t.type] || t.type,
  contact: t.contact,
  owner: MY_USER_ID,
  courierLink: '',
  planned: 0,
  created: t.created,
  updated: t.updated,
  synced: 0,
}));

console.log(`Transactions: ${transactions.length}`);

// Read planned transactions
const planned = db.prepare(`
  SELECT id, amount, info, date, type, contact, owner, created, updated
  FROM planned_transactions WHERE owner = ?
`).all(MY_USER_ID).map(t => ({
  id: t.id,
  amount: t.amount || 0,
  info: t.info || '',
  date: t.date,
  type: TYPE_MAP[t.type] || t.type,
  contact: t.contact,
  owner: MY_USER_ID,
  courierLink: '',
  planned: 1,
  created: t.created,
  updated: t.updated,
  synced: 0,
}));

console.log(`Planned transactions: ${planned.length}`);

// Calculate user balance from transactions
let userBalance = 0;
for (const t of transactions) {
  if (t.type === 'Income') userBalance += t.amount;
  if (t.type === 'Expense') userBalance -= t.amount;
  if (t.type === 'Refund') userBalance += t.amount;
}
console.log(`Calculated user balance: ${userBalance.toFixed(2)}`);

// Count types
const typeCounts = {};
for (const t of transactions) {
  typeCounts[t.type] = (typeCounts[t.type] || 0) + 1;
}
console.log('Type distribution:', typeCounts);

// Combine planned into transactions array
const allTransactions = [...transactions, ...planned];

const output = {
  userBalance: Math.round(userBalance * 100) / 100,
  contacts,
  transactions: allTransactions,
};

writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
console.log(`\nWritten to ${OUTPUT_PATH}`);
console.log(`  ${contacts.length} contacts`);
console.log(`  ${allTransactions.length} transactions (${planned.length} planned)`);

db.close();
