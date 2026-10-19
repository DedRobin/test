const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'banking.db');

(async () => {
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  console.log('=== Basic Transaction (COMMIT) ===\n');

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

  console.log('Starting transaction: Transfer $200 from Alice to Bob...\n');

  try {
    db.run('BEGIN TRANSACTION');

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

    if (fromBalance < 200) {
      throw new Error('Insufficient funds');
    }

    db.run('UPDATE Accounts SET balance = balance - 200 WHERE id = ?', [fromId]);
    console.log(`  ✓ Debited $200 from Alice`);

    db.run('UPDATE Accounts SET balance = balance + 200 WHERE id = ?', [toId]);
    console.log(`  ✓ Credited $200 to Bob`);

    db.run(
      'INSERT INTO Transactions (from_account_id, to_account_id, amount) VALUES (?, ?, ?)',
      [fromId, toId, 200]
    );
    console.log(`  ✓ Transaction logged\n`);

    db.run('COMMIT');
    console.log('Transaction COMMITTED successfully!\n');

  } catch (error) {
    db.run('ROLLBACK');
    console.error('Transaction FAILED:', error.message);
  }

  printAccounts();

  const txResult = db.exec('SELECT from_account_id, to_account_id, amount FROM Transactions ORDER BY timestamp DESC LIMIT 1');
  if (txResult.length > 0) {
    const [fromId, toId, amount] = txResult[0].values[0];
    console.log('Last transaction:');
    console.log(`  From Account #${fromId} to Account #${toId}: $${amount}`);
  }

  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  db.close();
})();
