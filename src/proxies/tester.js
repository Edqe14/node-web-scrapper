const fs = require('fs/promises');
const { join } = require('path');
const ProxyVerifier = require('proxy-verifier');

async function exists(path) {
  try {
    await fs.stat(path);
    return true;
  } catch {
    return false;
  }
}

module.exports = async function tester() {
  const testedBefore = await exists(join(__dirname, 'tested.json'));
  if (testedBefore) {
    const { timestamp, data } = await fs.readFile(join(__dirname, 'tested.json'), 'utf8').then((f) => JSON.parse(f));
    if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
      console.log('Data tested before is less than 24 hours old, skipping tests');
      return data;
    } 
  }
  
  const proxies = await fs.readFile(join(__dirname, 'untested.txt'), 'utf8').then((l) => l.split('\n').map((p) => p.split(':')));
  const start = Date.now();
  const alive = [];

  let durationRequest = 0;
  await Promise.all(proxies.map(([ip, port]) => {
    return new Promise((resolve) => {
      const startCheck = Date.now();
      let finished = false;

      ProxyVerifier.testProtocols({
        ipAddress: ip,
        port,
        protocols: ['http'],
      }, (_, res) => {
        if (finished) return;

        const endCheck = Date.now();
        const reqDurationRequest = endCheck - startCheck;

        durationRequest += reqDurationRequest;

        if (res.http.ok) {
          console.log(`"${ip}:${port}" is alive`);
          alive.push(`${ip}:${port}`);
        }

        return resolve(res);
      });

      setTimeout(() => {
        finished = true;
        resolve();
      }, 15_000);
    });
  }));

  const duration = Date.now() - start;

  console.clear();
  console.log(`Tested all proxies, took "${(duration / 1000).toFixed(2)}s", avg response time "${((durationRequest / 1000) / proxies.length).toFixed(2)}s"`);
  console.log(`${alive.length} out of ${proxies.length} is alive`);

  await fs.writeFile(join(__dirname, 'tested.json'), JSON.stringify({
    timestamp: Date.now(),
    data: alive
  }), 'utf8');

  return alive;
}