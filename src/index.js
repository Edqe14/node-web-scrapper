const proxyTester = require('./proxies/tester');
const { fork } = require('child_process');
const { join } = require('path');
const Chance = require('chance');

const chance = new Chance();
const runners = {};
const AMOUNT = parseInt(Number.isNaN(process.argv[2]) ? 10 : process.argv[2], 10);

async function main() {
  await proxyTester();

  console.log(`spawning ${AMOUNT} workers`);

  for (let i = 0; i < AMOUNT; i++) {
    const id = chance.bb_pin();
    const child = fork(join(__dirname, 'runner.js'), [id]);

    runners[id] = child;
  }
}

main();