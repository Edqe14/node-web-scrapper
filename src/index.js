const proxyTester = require('./proxies/tester');
const { fork } = require('child_process');
const { join } = require('path');
const Chance = require('chance');

const chance = new Chance();
const runners = {};
const AMOUNT = 10;

async function main() {
  await proxyTester();

  for (let i = 0; i < AMOUNT; i++) {
    const id = chance.bb_pin();
    const child = fork(join(__dirname, 'runner.js'), [id]);

    runners[id] = child;
  }
}

main();