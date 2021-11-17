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

async function fetch(url, proxy) {
  let ops = {
    timeout: 5000
  };
  if (proxy) {
    if (!proxy.startsWith('http')) proxy = `http://${proxy}`;

    const agent = new ProxyAgent(proxy);
    ops = { agent };
  }

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
    metas
  });

  await newEntry.save();
}

async function run() {
  const rand = chance.ip();

  if (await WebMeta.find({ url: rand }).count().exec() !== 0) return run();

  try {
    await fetch(`http://${rand}`);
    console.log(`Scrapped ${rand}`);
  } catch(e) {
    console.log(`Err fetching ${rand}: ${e?.message}`);
  }

  run();
}

async function main() {
  await connectDb().then(() => console.log('Database connected'));

  run();
}

main();