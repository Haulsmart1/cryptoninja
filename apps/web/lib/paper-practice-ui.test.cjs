const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { act } = React;
const { JSDOM } = require('jsdom');

function compile(path, imports = {}) {
  const output = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', output)(name => imports[name] ?? require(name), exports);
  return exports;
}

test('actual practice page opens, gains, closes and resets without network access', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/practice' });
  const previous = { window: global.window, document: global.document, act: global.IS_REACT_ACT_ENVIRONMENT, fetch: global.fetch };
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  let requests = 0;
  global.fetch = async () => { requests++; throw new Error('Network forbidden in practice'); };
  dom.window.confirm = () => true;
  const { createRoot } = require('react-dom/client');
  const engine = compile(`${__dirname}/paper-practice.ts`);
  const page = compile(`${__dirname}/../app/practice/page.tsx`, {
    '@/lib/paper-practice': engine,
    'next/link': { default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) },
  }).default;
  const root = createRoot(document.getElementById('root'));
  const button = text => [...document.querySelectorAll('button')].find(x => x.textContent === text);
  const cash = () => document.querySelector('dl dd').textContent;
  try {
    await act(async () => root.render(React.createElement(page)));
    assert.equal(cash(), '£10.00');
    assert.match(document.body.textContent, /fabricated scenarios, not live prices/);
    assert.equal(button('Close simulated position').disabled, true);
    await act(async () => document.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
    assert.equal(cash(), '£0.00');
    assert.equal(button('Open simulated position').disabled, true);
    await act(async () => button('Up 5%').click());
    await act(async () => button('Close simulated position').click());
    assert.equal(cash(), '£10.50');
    assert.equal(button('Close simulated position').disabled, true);
    await act(async () => button('Reset practice account').click());
    assert.equal(cash(), '£10.00');
    await act(async () => document.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
    await act(async () => button('Down 5%').click());
    await act(async () => button('Close simulated position').click());
    assert.equal(cash(), '£9.50');
    assert.equal(requests, 0);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    global.window = previous.window;
    global.document = previous.document;
    global.IS_REACT_ACT_ENVIRONMENT = previous.act;
    global.fetch = previous.fetch;
  }
});
