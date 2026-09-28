'use strict';
const { runUnitSuite } = require('./tests/suite-unit');
const { runIntegrationSuite } = require('./tests/suite-integration');
const { runInteractiveSuite } = require('./tests/suite-interactive');

console.log('===============================================================');
console.log(' STARTING AUTOMATED TEST VERIFICATION: OBNINSK MAP');
console.log('===============================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];
const asyncTasks = [];

const reporter = {
  test(name, fn) {
    totalTests++;
    try {
      fn();
      passedTests++;
      console.log(`  [PASS] ${name}`);
    } catch (err) {
      failedTests++;
      failures.push({ name, error: err.message, stack: err.stack });
      console.error(`  [FAIL] ${name}`);
      console.error(`    Error: ${err.message}`);
    }
  },

  testAsync(name, fn) {
    totalTests++;
    const p = (async () => {
      try {
        await fn();
        passedTests++;
        console.log(`  [PASS] ${name}`);
      } catch (err) {
        failedTests++;
        failures.push({ name, error: err.message, stack: err.stack });
        console.error(`  [FAIL] ${name}`);
        console.error(`    Error: ${err.message}`);
      }
    })();
    asyncTasks.push(p);
  }
};

(async () => {
  runUnitSuite(reporter);
  runIntegrationSuite(reporter);
  runInteractiveSuite(reporter);

  await Promise.all(asyncTasks);

  console.log('\n===============================================================');
  console.log(` VERIFICATION COMPLETE: ${passedTests} / ${totalTests} tests passed`);
  if (failedTests > 0) {
    console.error(` STATUS: FAILED (${failedTests} failures)`);
    for (const f of failures) {
      console.error(`\nFailure in: ${f.name}`);
      console.error(`Error: ${f.error}`);
    }
    process.exit(1);
  } else {
    console.log(' STATUS: ALL TESTS PASSED (100% verified with live execution)');
    console.log('===============================================================\n');
    process.exit(0);
  }
})();
