const { config } = require('dotenv');
const { join } = require('path');
config({
  path: join(__dirname, '..', '.env'),
});

const connectDb = require('./db');
const Chance = require('chance');
const WebMeta = require('./models/WebMeta');
const get = require('miniget');
const ProxyAgent = require('proxy-agent');
const HTMLParser = require('node-html-parser');

const chance = new Chance();
const { data: proxies } = require('./proxies/tested.json');
const id = process.argv[2] ?? chance.bb_pin();

const done = new Set();

async function fetch(url, proxy) {
  let ops = {
    timeout: 10000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
    }
  };

  if (proxy) {
    if (!proxy.startsWith('http')) proxy = `http://${proxy}`;

    const agent = new ProxyAgent(proxy);
    ops = { agent, ...ops };
  }

  const startTime = Date.now();
  const html = await get(url, ops).text();

  const document = HTMLParser.parse(html);

  const metas = document.querySelectorAll('meta').map((el) => {
    const name = el.attrs.name;
    const content = el.attrs.content;
    
    if (!name || !content) return null;

    return [name, content];
  }).filter((mts) => {
    if (!mts) return false;
  
    const name = mts[0];

    switch (name) {
      case 'viewport':
      case 'next-head-count': return false;

      default: return true;
    }
  }).reduce((acc, mts) => {
    acc[mts[0]] = mts[1];

    return acc;
  }, {});

  const title = document.querySelector('title')?.innerHTML;
  const description = metas.dscription ?? metas['og:description'];

  const newEntry = new WebMeta({
    url,
    proxy,
    title,
    description,
    timeTook: Date.now() - startTime,
    metas
  });

  newEntry.save();
}

async function run() {
  const rand = `http://${chance.ip()}`;
  const proxy = `http://${proxies[~~(Math.random() * proxies.length)]}`;

  if (done.has(rand) || await WebMeta.find({ url: rand }).count().exec() !== 0) {
    done.add(rand);
    return run();
  }

  try {
    await fetch(rand);
    console.log(`(${id}) Scrapped ${rand}`);
  } catch(e) {
    // console.log(`(${id}) Err fetching ${rand}: ${e?.message}`);
    done.add(rand);
  }

  run();
}

async function main() {
  await connectDb().then(() => console.log('Database connected'));
  
  console.log(`(${id}) starting runner`);

  run();
}

main();
