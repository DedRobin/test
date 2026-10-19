const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'banking.db');

(async () => {
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  console.log('=== Transaction Rollback ===\n');

  function printAccounts() {
    const results = db.exec('SELECT user_name, balance FROM Accounts');
    if (results.length === 0) {
      console.log('  (no accounts)\n');
      return;
    }
    console.log('Current accounts:');
    for (const row of results[0].values) {
      console.log(`  ${row[0]}: $${row[1]}`);
    }
    console.log();
  }

  printAccounts();

  console.log('Attempting transaction: Transfer $5000 from Alice to Bob (should fail)...\n');

  db.run('BEGIN TRANSACTION');

  try {
    const fromStmt = db.prepare('SELECT id, balance FROM Accounts WHERE user_name = :name');
    fromStmt.bind({ ':name': 'Alice' });
    fromStmt.step();
    const [fromId, fromBalance] = fromStmt.get();
    fromStmt.free();

    const toStmt = db.prepare('SELECT id FROM Accounts WHERE user_name = :name');
    toStmt.bind({ ':name': 'Bob' });
    toStmt.step();
    const [toId] = toStmt.get();
    toStmt.free();

    console.log(`  Attempting to debit $5000 from Alice (balance: $${fromBalance})...`);

    if (fromBalance < 5000) {
      console.log(`  ✗ Insufficient funds! Balance: $${fromBalance}, Required: $5000`);
      throw new Error('Insufficient funds - transaction will rollback');
    }

    db.run('UPDATE Accounts SET balance = balance - 5000 WHERE id = ?', [fromId]);
    console.log(`  ✓ Debited $5000 from Alice`);

    db.run('UPDATE Accounts SET balance = balance + 5000 WHERE id = ?', [toId]);
    console.log(`  ✓ Credited $5000 to Bob`);

    db.run(
      'INSERT INTO Transactions (from_account_id, to_account_id, amount) VALUES (?, ?, ?)',
      [fromId, toId, 5000]
    );

    db.run('COMMIT');

  } catch (error) {
    db.run('ROLLBACK');
    console.log(`\n  ⚠ Transaction ROLLED BACK: ${error.message}\n`);
  }

  console.log('Accounts after failed transaction (no changes):');
  printAccounts();

  const countResult = db.exec('SELECT COUNT(*) FROM Transactions');
  const txCount = countResult[0].values[0][0];
  console.log(`Total transactions in history: ${txCount}`);
  console.log('(Failed transaction was not logged)\n');

  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  db.close();
})();
