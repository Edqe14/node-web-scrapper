const proxyTester = require('./proxies/tester');
const { spawn } = require('child_process');

async function main() {
  await proxyTester();
}

main();