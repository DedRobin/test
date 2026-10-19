const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'banking.db');

(async () => {
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  console.log('=== Savepoints (Partial Rollback) ===\n');

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

  console.log('Complex transaction with savepoints:\n');

  try {
    db.run('BEGIN TRANSACTION');
    console.log('1. Starting main transaction...');

    const getAccount = (name) => {
      const stmt = db.prepare('SELECT id, balance FROM Accounts WHERE user_name = :name');
      stmt.bind({ ':name': name });
      stmt.step();
      const row = stmt.get();
      stmt.free();
      return { id: row[0], balance: row[1] };
    };

    const alice = getAccount('Alice');
    const bob = getAccount('Bob');
    const charlie = getAccount('Charlie');

    db.run('UPDATE Accounts SET balance = balance - 100 WHERE id = ?', [alice.id]);
    db.run('UPDATE Accounts SET balance = balance + 100 WHERE id = ?', [bob.id]);
    console.log('  ✓ Step 1: Alice → Bob: $100');

    db.run('SAVEPOINT step2');
    console.log('  ✓ Savepoint "step2" created');

    db.run('UPDATE Accounts SET balance = balance - 200 WHERE id = ?', [bob.id]);
    db.run('UPDATE Accounts SET balance = balance + 200 WHERE id = ?', [charlie.id]);
    console.log('  ✓ Step 2: Bob → Charlie: $200');

    db.run('SAVEPOINT step3');
    console.log('  ✓ Savepoint "step3" created');

    console.log('  ✗ Step 3: Attempting invalid operation (Charlie → Alice: $10000)...');
    if (charlie.balance + 200 < 10000) {
      console.log('  ⚠ Error detected! Rolling back to savepoint "step3"...');
      db.run('ROLLBACK TO SAVEPOINT step3');
      console.log('  ✓ Rolled back to savepoint "step3" (Step 2 still active)');
    }

    db.run('UPDATE Accounts SET balance = balance - 50 WHERE id = ?', [alice.id]);
    db.run('UPDATE Accounts SET balance = balance + 50 WHERE id = ?', [charlie.id]);
    console.log('  ✓ Step 4: Alice → Charlie: $50');

    db.run('COMMIT');
    console.log('\nTransaction COMMITTED (partial rollback via savepoints)!\n');

  } catch (error) {
    db.run('ROLLBACK');
    console.error('Transaction FAILED:', error.message);
  }

  printAccounts();

  const txResult = db.exec('SELECT from_account_id, to_account_id, amount FROM Transactions ORDER BY timestamp DESC LIMIT 5');
  if (txResult.length > 0) {
    console.log('Recent transactions:');
    for (const row of txResult[0].values) {
      console.log(`  Account #${row[0]} → Account #${row[1]}: $${row[2]}`);
    }
  }

  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  db.close();
})();
