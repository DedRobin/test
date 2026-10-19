const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'banking.db');

(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  console.log('Creating banking database...\n');

  db.run(`
    CREATE TABLE Accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_name TEXT NOT NULL,
      balance INTEGER NOT NULL CHECK(balance >= 0),
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE Transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_account_id INTEGER NOT NULL,
      to_account_id INTEGER NOT NULL,
      amount INTEGER NOT NULL CHECK(amount > 0),
      timestamp TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (from_account_id) REFERENCES Accounts(id),
      FOREIGN KEY (to_account_id) REFERENCES Accounts(id)
    )
  `);

  console.log('✓ Tables created: Accounts, Transactions');

  const accounts = [
    ['Alice', 1000],
    ['Bob', 500],
    ['Charlie', 750]
  ];

  const stmt = db.prepare('INSERT INTO Accounts (user_name, balance) VALUES (?, ?)');
  for (const [name, balance] of accounts) {
    stmt.run([name, balance]);
  }
  stmt.free();

  console.log('✓ Sample accounts created:');
  accounts.forEach(([name, balance]) => {
    console.log(`  - ${name}: $${balance}`);
  });

  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);

  console.log('\n✓ Database saved to:', dbPath);
  console.log('\nRun examples:');
  console.log('  npm run demo:basic');
  console.log('  npm run demo:rollback');
  console.log('  npm run demo:savepoint');
  console.log('  npm run demo:isolation');

  db.close();
})();
