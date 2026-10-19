const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'banking.db');

(async () => {
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  console.log('=== Manual Error Emulation Techniques ===\n');

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
  // Technique 1: Explicit RAISE statement
  // ========================================================================
  console.log('━'.repeat(60));
  console.log('Technique 1: RAISE statement (SQL-level error)');
  console.log('━'.repeat(60));
  console.log('Using SQL RAISE to manually trigger an error...\n');

  try {
    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare('SELECT id, balance FROM Accounts WHERE user_name = :name');
    stmt.bind({ ':name': 'Alice' });
    stmt.step();
    const [id, balance] = stmt.get();
    stmt.free();

    console.log(`  Alice's balance: $${balance}`);

    // Эмулируем ошибку с помощью RAISE
    if (balance < 5000) {
      console.log('  Triggering RAISE ABORT: Insufficient funds for premium transfer');
      db.run('SELECT RAISE(ABORT, "Insufficient funds for premium transfer")');
    }

    db.run('UPDATE Accounts SET balance = balance - 100 WHERE id = ?', [id]);
    db.run('COMMIT');

  } catch (error) {
    db.run('ROLLBACK');
    console.log(`  ✗ Caught: ${error.message}`);
    console.log('  → Transaction ROLLED BACK\n');
  }

  printAccounts('After Technique 1');

  // ========================================================================
  // Technique 2: Simulated network/system failure
  // ========================================================================
  console.log('━'.repeat(60));
  console.log('Technique 2: Simulated system failure (JavaScript error)');
  console.log('━'.repeat(60));
  console.log('Emulating mid-transaction crash...\n');

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

    console.log('  Step 1: Debiting Alice...');
    db.run('UPDATE Accounts SET balance = balance - 50 WHERE id = ?', [aliceId]);
    console.log('  ✓ Done');

    console.log('  Step 2: Simulating network failure...');
    throw new Error('Network timeout: connection lost');

    console.log('  Step 3: Crediting Bob...');
    db.run('UPDATE Accounts SET balance = balance + 50 WHERE id = ?', [bobId]);

    db.run('COMMIT');

  } catch (error) {
    db.run('ROLLBACK');
    console.log(`  ✗ System error: ${error.message}`);
    console.log('  → Transaction ROLLED BACK (Alice\'s debit was undone)\n');
  }

  printAccounts('After Technique 2');

  // ========================================================================
  // Technique 3: Conditional rollback based on external state
  // ========================================================================
  console.log('━'.repeat(60));
  console.log('Technique 3: External validation failure');
  console.log('━'.repeat(60));
  console.log('Simulating failed external API check...\n');

  async function validateTransfer(fromUser, amount) {
    // Эмуляция внешней проверки (например, API банка)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (amount > 1000) {
          reject(new Error('External API: Transfer limit exceeded'));
        }
        resolve(true);
      }, 100);
    });
  }

  try {
    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare('SELECT id, balance FROM Accounts WHERE user_name = :name');
    stmt.bind({ ':name': 'Charlie' });
    stmt.step();
    const [id, balance] = stmt.get();
    stmt.free();

    console.log(`  Charlie's balance: $${balance}`);
    console.log('  Attempting transfer: $1500');
    console.log('  Calling external validation API...');

    await validateTransfer('Charlie', 1500);

    db.run('UPDATE Accounts SET balance = balance - 1500 WHERE id = ?', [id]);
    db.run('COMMIT');

  } catch (error) {
    db.run('ROLLBACK');
    console.log(`  ✗ External validation failed: ${error.message}`);
    console.log('  → Transaction ROLLED BACK\n');
  }

  printAccounts('After Technique 3');

  // ========================================================================
  // Technique 4: Partial success with savepoint rollback
  // ========================================================================
  console.log('━'.repeat(60));
  console.log('Technique 4: Partial rollback with savepoints');
  console.log('━'.repeat(60));
  console.log('Rolling back only the failed part...\n');

  try {
    db.run('BEGIN TRANSACTION');

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

    console.log('  Step 1: Alice → Bob: $50');
    db.run('UPDATE Accounts SET balance = balance - 50 WHERE id = ?', [alice.id]);
    db.run('UPDATE Accounts SET balance = balance + 50 WHERE id = ?', [bob.id]);
    console.log('  ✓ Success');

    db.run('SAVEPOINT step2');
    console.log('  ✓ Savepoint created');

    console.log('  Step 2: Alice → Bob: $5000 (will fail)');
    if (alice.balance - 50 < 5000) {
      console.log('  ✗ Insufficient funds for step 2');
      console.log('  → Rolling back to savepoint (keeping step 1)');
      db.run('ROLLBACK TO SAVEPOINT step2');
    }

    db.run('COMMIT');
    console.log('  ✓ Main transaction committed (step 1 kept, step 2 rolled back)\n');

  } catch (error) {
    db.run('ROLLBACK');
    console.error('  Full rollback:', error.message);
  }

  printAccounts('After Technique 4');

  console.log('Summary of error emulation techniques:');
  console.log('  1. RAISE statement — SQL-level error');
  console.log('  2. JavaScript throw — simulate crashes/timeouts');
  console.log('  3. External validation — async checks with Promise rejection');
  console.log('  4. Savepoints — partial rollback without full transaction abort');

  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  db.close();
})();
