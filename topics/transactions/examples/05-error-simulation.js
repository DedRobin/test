const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'banking.db');

(async () => {
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  console.log('=== Error Simulation in Transactions ===\n');

  function printAccounts(label) {
    const results = db.exec('SELECT user_name, balance FROM Accounts');
    console.log(`${label}:`);
    for (const row of results[0].values) {
      console.log(`  ${row[0]}: $${row[1]}`);
    }
    console.log();
  }

  printAccounts('Initial state');

  // ========================================================================
  // Scenario 1: Constraint violation (CHECK constraint)
  // ========================================================================
  console.log('━'.repeat(60));
  console.log('Scenario 1: CHECK constraint violation');
  console.log('━'.repeat(60));
  console.log('Attempting to withdraw $2000 from Alice (balance: $800)...\n');

  try {
    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare('SELECT id, balance FROM Accounts WHERE user_name = :name');
    stmt.bind({ ':name': 'Alice' });
    stmt.step();
    const [id, balance] = stmt.get();
    stmt.free();

    console.log(`  Current balance: $${balance}`);
    console.log(`  Attempting to withdraw: $2000`);

    db.run('UPDATE Accounts SET balance = balance - 2000 WHERE id = ?', [id]);

    // Если balance стал отрицательным, это нарушает CHECK constraint
    const newBalanceStmt = db.prepare('SELECT balance FROM Accounts WHERE id = ?');
    newBalanceStmt.bind([id]);
    newBalanceStmt.step();
    const newBalance = newBalanceStmt.get()[0];
    newBalanceStmt.free();

    console.log(`  New balance would be: $${newBalance}`);

    if (newBalance < 0) {
      throw new Error('CHECK constraint failed: balance cannot be negative');
    }

    db.run('COMMIT');
    console.log('  ✓ Transaction committed');

  } catch (error) {
    db.run('ROLLBACK');
    console.log(`  ✗ Error: ${error.message}`);
    console.log('  → Transaction ROLLED BACK\n');
  }

  printAccounts('After Scenario 1');

  // ========================================================================
  // Scenario 2: Foreign key violation
  // ========================================================================
  console.log('━'.repeat(60));
  console.log('Scenario 2: Foreign key violation');
  console.log('━'.repeat(60));
  console.log('Attempting to create transaction for non-existent account...\n');

  try {
    db.run('BEGIN TRANSACTION');

    console.log('  Inserting transaction: Account #999 → Account #1: $100');
    console.log('  (Account #999 does not exist)');

    db.run(
      'INSERT INTO Transactions (from_account_id, to_account_id, amount) VALUES (999, 1, 100)'
    );

    db.run('COMMIT');
    console.log('  ✓ Transaction committed');

  } catch (error) {
    db.run('ROLLBACK');
    console.log(`  ✗ Error: ${error.message}`);
    console.log('  → Transaction ROLLED BACK\n');
  }

  printAccounts('After Scenario 2');

  // ========================================================================
  // Scenario 3: Business logic error (manual rollback)
  // ========================================================================
  console.log('━'.repeat(60));
  console.log('Scenario 3: Business logic validation');
  console.log('━'.repeat(60));
  console.log('Transfer $300 from Bob to Charlie, but require minimum balance $100\n');

  try {
    db.run('BEGIN TRANSACTION');

    const bobStmt = db.prepare('SELECT id, balance FROM Accounts WHERE user_name = :name');
    bobStmt.bind({ ':name': 'Bob' });
    bobStmt.step();
    const [bobId, bobBalance] = bobStmt.get();
    bobStmt.free();

    const charlieStmt = db.prepare('SELECT id FROM Accounts WHERE user_name = :name');
    charlieStmt.bind({ ':name': 'Charlie' });
    charlieStmt.step();
    const [charlieId] = charlieStmt.get();
    charlieStmt.free();

    console.log(`  Bob's balance: $${bobBalance}`);
    console.log(`  Transfer amount: $300`);
    console.log(`  Minimum required balance: $100`);

    const remainingBalance = bobBalance - 300;
    console.log(`  Balance after transfer: $${remainingBalance}`);

    if (remainingBalance < 100) {
      throw new Error('Business rule violated: minimum balance must be $100');
    }

    db.run('UPDATE Accounts SET balance = balance - 300 WHERE id = ?', [bobId]);
    db.run('UPDATE Accounts SET balance = balance + 300 WHERE id = ?', [charlieId]);

    db.run(
      'INSERT INTO Transactions (from_account_id, to_account_id, amount) VALUES (?, ?, ?)',
      [bobId, charlieId, 300]
    );

    db.run('COMMIT');
    console.log('  ✓ Transaction committed');

  } catch (error) {
    db.run('ROLLBACK');
    console.log(`  ✗ Error: ${error.message}`);
    console.log('  → Transaction ROLLED BACK\n');
  }

  printAccounts('After Scenario 3');

  // ========================================================================
  // Scenario 4: Successful transaction after errors
  // ========================================================================
  console.log('━'.repeat(60));
  console.log('Scenario 4: Successful transaction (valid operation)');
  console.log('━'.repeat(60));
  console.log('Transfer $100 from Alice to Bob (valid operation)...\n');

  try {
    db.run('BEGIN TRANSACTION');

    const aliceStmt = db.prepare('SELECT id, balance FROM Accounts WHERE user_name = :name');
    aliceStmt.bind({ ':name': 'Alice' });
    aliceStmt.step();
    const [aliceId, aliceBalance] = aliceStmt.get();
    aliceStmt.free();

    const bobStmt = db.prepare('SELECT id FROM Accounts WHERE user_name = :name');
    bobStmt.bind({ ':name': 'Bob' });
    bobStmt.step();
    const [bobId] = bobStmt.get();
    bobStmt.free();

    console.log(`  Alice's balance: $${aliceBalance}`);
    console.log(`  Transfer amount: $100`);

    if (aliceBalance < 100) {
      throw new Error('Insufficient funds');
    }

    db.run('UPDATE Accounts SET balance = balance - 100 WHERE id = ?', [aliceId]);
    console.log('  ✓ Debited $100 from Alice');

    db.run('UPDATE Accounts SET balance = balance + 100 WHERE id = ?', [bobId]);
    console.log('  ✓ Credited $100 to Bob');

    db.run(
      'INSERT INTO Transactions (from_account_id, to_account_id, amount) VALUES (?, ?, ?)',
      [aliceId, bobId, 100]
    );
    console.log('  ✓ Transaction logged');

    db.run('COMMIT');
    console.log('  ✓ Transaction COMMITTED successfully\n');

  } catch (error) {
    db.run('ROLLBACK');
    console.log(`  ✗ Error: ${error.message}`);
    console.log('  → Transaction ROLLED BACK\n');
  }

  printAccounts('Final state');

  const txCount = db.exec('SELECT COUNT(*) FROM Transactions');
  console.log(`Total transactions in history: ${txCount[0].values[0][0]}`);
  console.log('(Only successful transactions were logged)\n');

  console.log('Key takeaways:');
  console.log('  • BEGIN TRANSACTION ... COMMIT/ROLLBACK — базовый паттерн');
  console.log('  • Любая ошибка в try/catch вызывает ROLLBACK');
  console.log('  • Проверки могут быть на уровне БД (constraints) или бизнес-логики');
  console.log('  • После ошибки транзакция откатывается полностью (atomicity)');

  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  db.close();
})();
