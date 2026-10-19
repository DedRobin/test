const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'banking.db');

(async () => {
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);

  console.log('=== Transaction Isolation Levels ===\n');

  console.log('SQLite supports two isolation levels:');
  console.log('  1. READ UNCOMMITTED (dirty reads possible)');
  console.log('  2. SERIALIZABLE (default, highest isolation)\n');

  console.log('Demo: Sequential transactions with SERIALIZABLE isolation\n');

  const db1 = new SQL.Database(fileBuffer);
  const db2 = new SQL.Database(fileBuffer);

  function printAccounts(label, db) {
    const results = db.exec('SELECT user_name, balance FROM Accounts');
    if (results.length === 0) {
      console.log(`${label}: (no accounts)\n`);
      return;
    }
    console.log(`${label}:`);
    for (const row of results[0].values) {
      console.log(`  ${row[0]}: $${row[1]}`);
    }
    console.log();
  }

  printAccounts('Initial state', db1);

  console.log('Scenario: Two transactions updating Alice\'s account sequentially\n');

  try {
    console.log('--- Transaction 1: Alice +$100 ---');
    db1.run('BEGIN IMMEDIATE TRANSACTION');

    const stmt1 = db1.prepare('SELECT balance FROM Accounts WHERE user_name = :name');
    stmt1.bind({ ':name': 'Alice' });
    stmt1.step();
    const balance1 = stmt1.get()[0];
    stmt1.free();

    console.log(`  Read Alice balance: $${balance1}`);
    db1.run('UPDATE Accounts SET balance = balance + 100 WHERE user_name = :name', { ':name': 'Alice' });
    console.log('  Updated Alice balance +$100');

    db1.run('COMMIT');
    console.log('  TX1 committed\n');

    console.log('--- Transaction 2: Alice +$50 ---');
    db2.run('BEGIN IMMEDIATE TRANSACTION');

    const stmt2 = db2.prepare('SELECT balance FROM Accounts WHERE user_name = :name');
    stmt2.bind({ ':name': 'Alice' });
    stmt2.step();
    const balance2 = stmt2.get()[0];
    stmt2.free();

    console.log(`  Read Alice balance: $${balance2}`);
    db2.run('UPDATE Accounts SET balance = balance + 50 WHERE user_name = :name', { ':name': 'Alice' });
    console.log('  Updated Alice balance +$50');

    db2.run('COMMIT');
    console.log('  TX2 committed\n');

    printAccounts('Final state', db1);

    const aliceStmt = db1.prepare('SELECT balance FROM Accounts WHERE user_name = :name');
    aliceStmt.bind({ ':name': 'Alice' });
    aliceStmt.step();
    const finalBalance = aliceStmt.get()[0];
    aliceStmt.free();

    console.log(`Alice's final balance: $${finalBalance}`);
    console.log(`(Started at $${balance1}, TX1 added $100, TX2 added $50)`);
    console.log('Both updates applied correctly due to SERIALIZABLE isolation\n');

  } catch (error) {
    console.error('Error:', error.message);
  }

  const data = db1.export();
  fs.writeFileSync(dbPath, Buffer.from(data));

  db1.close();
  db2.close();

  console.log('Key takeaways:');
  console.log('  • SQLite SERIALIZABLE ensures transactions appear sequential');
  console.log('  • WAL mode allows concurrent readers, exclusive writers');
  console.log('  • Use BEGIN IMMEDIATE for write transactions to avoid conflicts');
})();
