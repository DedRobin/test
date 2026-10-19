const { execSync } = require('child_process');
const path = require('path');
const readline = require('readline');

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║     Database Transactions Practice - All Examples        ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

const examples = [
  { name: 'Basic Transaction (COMMIT)', script: '01-basic-transaction.js' },
  { name: 'Transaction Rollback', script: '02-rollback.js' },
  { name: 'Savepoints', script: '03-savepoint.js' },
  { name: 'Isolation Levels', script: '04-isolation.js' }
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

(async () => {
  for (let i = 0; i < examples.length; i++) {
    const example = examples[i];
    console.log('\n' + '═'.repeat(60));
    console.log(`Example ${i + 1}: ${example.name}`);
    console.log('═'.repeat(60) + '\n');

    try {
      execSync(`node "${path.join(__dirname, example.script)}"`, {
        stdio: 'inherit',
        cwd: __dirname
      });
    } catch (error) {
      console.error(`Error running ${example.name}:`, error.message);
    }

    if (i < examples.length - 1) {
      await askQuestion('\nPress Enter to continue to next example...');
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('All examples completed!');
  console.log('═'.repeat(60));

  rl.close();
})();
