import { ruleTester } from '../testing/test-helper';
import { requireTimeoutForIo } from './require-timeout-for-io';

describe('require-timeout-for-io', () => {
  ruleTester.run('require-timeout-for-io', requireTimeoutForIo, {
    valid: [
      {
        name: 'should accept named default Axios with a timeout',
        code: 'import { default as client } from "axios"; client(url, { timeout: 1000 });',
      },
      {
        name: 'should accept named default fetch with a signal',
        code: 'import { default as load } from "node-fetch"; load(url, { signal: controller.signal });',
      },
      {
        name: 'should preserve shadowing of a named default import',
        code: 'import { default as client } from "axios"; function run(client) { client(url); }',
      },
      {
        name: 'should ignore named default imports from unrelated modules',
        code: 'import { default as client } from "other"; client(url);',
      },
      {
        name: 'should accept angle asserted timeout options',
        code: 'axios.get(url, <{ timeout: number }>{ timeout: 1000 });',
      },
      {
        name: 'should accept nonnull timeout aliases',
        code: 'const options = { timeout: 1000 }; axios.get(url, options!);',
      },
      {
        name: 'should accept optional computed imported client calls',
        code: 'import { default as client } from "axios"; client?.["get"]?.(url, { timeout: 1000 });',
      },
      {
        name: 'should respect nested client shadowing',
        code: 'import client from "axios"; function run(client) { client.get(url); }',
      },
      {
        name: 'should accept nested timeout value assertions',
        code: 'axios.get(url, { timeout: ((1000 as number) satisfies number)! });',
      },
      {
        name: 'should accept computed static timeout keys',
        code: 'axios.get(url, { ["timeout"]: 1000 });',
      },
      {
        name: 'should accept shadowed special-value parameters',
        code: 'function load(undefined, NaN, Infinity) { axios.get(url, { timeout: undefined }); axios.get(url, { timeout: NaN }); axios.get(url, { timeout: Infinity }); }',
      },
      {
        name: 'should resolve positive local constants with global names',
        code: 'function load() { const undefined = 1000; const NaN = 2000; const Infinity = 3000; axios.get(url, { timeout: undefined }); axios.get(url, { timeout: NaN }); axios.get(url, { timeout: Infinity }); }',
      },
      {
        name: 'should treat shadowed undefined as runtime in logical expressions',
        code: 'function load(undefined) { axios.get(url, { timeout: undefined && 5000 }); }',
      },
      {
        name: 'should accept a shadowed runtime Got timeout object',
        code: 'function load(Infinity) { got(url, { timeout: Infinity }); }',
      },
      {
        name: 'should retain runtime aliases of shadowed constants',
        code: 'function load(NaN) { const timeout = NaN; axios.get(url, { timeout }); }',
      },
      {
        name: 'should accept constant timeout arithmetic',
        code: 'axios.get(url, { timeout: 5 * 1000 });',
      },
      {
        name: 'should resolve arithmetic constants and aliases',
        code: 'const duration = 5 * 1000; const timeout = duration; axios.get(url, { timeout });',
      },
      {
        name: 'should accept runtime arithmetic',
        code: 'axios.get(url, { timeout: seconds * 1000 });',
      },
      {
        name: 'should accept nullish runtime fallbacks',
        code: 'axios.get(url, { timeout: configuredTimeout ?? 5000 });',
      },
      {
        name: 'should accept undefined and null fallbacks',
        code: 'axios.get(url, { timeout: undefined ?? 5000 }); axios.get(url, { timeout: null ?? 5000 });',
      },
      {
        name: 'should accept void fallbacks',
        code: 'axios.get(url, { timeout: void 0 ?? 5000 });',
      },
      {
        name: 'should accept numeric OR fallbacks',
        code: 'axios.get(url, { timeout: 0 || 5000 }); axios.get(url, { timeout: 5000 || 0 });',
      },
      {
        name: 'should accept numeric AND branches',
        code: 'axios.get(url, { timeout: 1 && 5000 });',
      },
      {
        name: 'should accept runtime logical fallbacks',
        code: 'axios.get(url, { timeout: configuredTimeout || 5000 });',
      },
      {
        name: 'should accept supported arithmetic operators',
        code: 'axios.get(url, { timeout: (2 ** 3 + 6 - 2) / 2 % 5 });',
      },
      {
        name: 'should accept unary numeric signs',
        code: 'axios.get(url, { timeout: -(-5000) }); axios.get(url, { timeout: +5000 });',
      },
      {
        name: 'should accept signed runtime timeout',
        code: 'axios.get(url, { timeout: +duration });',
      },
      {
        name: 'should accept arithmetic Got phase timeouts',
        code: 'got(url, { timeout: { request: 5 * 1000 } });',
      },
      {
        name: 'should accept arithmetic chained timeouts',
        code: 'superagent.get(url).timeout(5 * 1000);',
      },
      {
        name: 'should accept arithmetic subprocess timeouts',
        code: 'spawn(cmd, [], { timeout: 5 * 1000 });',
      },
      {
        name: 'should accept unresolved Got timeout objects',
        code: 'got(url, { timeout: settings.timeout });',
      },
      {
        name: 'should allow observed options',
        code: 'const options = { signal }; const state = typeof options.signal; fetch(url, options);',
      },
      {
        name: 'should allow spread options without overrides',
        code: 'const options = { signal }; fetch(url, { ...options, method: "GET" });',
      },
      {
        name: 'should allow preceding signal and a known unrelated spread',
        code: 'const extra = { method: "GET" }; fetch(url, { signal, ...extra });',
      },
      {
        name: 'should resolve local options',
        code: 'const options = { signal }; fetch(url, options);',
      },
      {
        name: 'should resolve alias imports',
        code: 'import http from "axios"; http.post(url, body, { timeout: 100 });',
      },
      {
        name: 'should resolve named imports',
        code: 'import { get as read } from "axios"; read(url, { timeout: 100 });',
      },
      {
        name: 'should resolve fetch import',
        code: 'import read from "node-fetch"; read(url, { signal });',
      },
      {
        name: 'should ignore shadowed clients',
        code: 'function run(fetch, axios, spawn) { fetch(url); axios.get(url); spawn(cmd); }',
      },
      { name: 'should ignore unrelated imports', code: 'import { exec } from "other"; exec(cmd);' },
      { name: 'should ignore client factories', code: 'axios.create();' },
      { name: 'should allow config-only axios', code: 'axios({ url, timeout: 100 });' },
      { name: 'should allow axios request', code: 'axios.request({ url, timeout: 100 });' },
      {
        name: 'should allow got timeout objects',
        code: 'got(url, { timeout: { request: 100 } });',
      },
      {
        name: 'should allow got config-only calls',
        code: 'got({ url, timeout: { response: 100 } });',
      },
      {
        name: 'should allow superagent deadline objects',
        code: 'superagent.get(url).timeout({ deadline: 100 });',
      },
      { name: 'should allow subprocess omitted argv', code: 'spawn(cmd, { timeout: 100 });' },
      {
        name: 'should allow subprocess default imports',
        code: 'import cp from "node:child_process"; cp.execFile(cmd, [], { timeout: 100 });',
      },
      {
        name: 'should allow stable spreads',
        code: 'const options = { signal }; fetch(url, { ...options });',
      },
      { name: 'should allow final explicit option', code: 'fetch(url, { ...unknown, signal });' },
      {
        name: 'should allow custom IO options',
        code: 'readRemote(url, { timeout: 100 });',
        options: [{ additionalIoFunctionNames: ['readRemote'] }],
      },
      {
        name: 'should allow fetch with signal',
        code: 'fetch(url, { signal });',
      },
      {
        name: 'should allow axios with timeout',
        code: 'axios.get(url, { timeout: 5000 });',
      },
      {
        name: 'should allow a quoted timeout property',
        code: "axios.get(url, { 'timeout': 5000 });",
      },
      {
        name: 'should allow a runtime timeout expression',
        code: 'axios.get(url, { timeout: requestTimeout });',
      },
      {
        name: 'should allow subprocess with timeout',
        code: "spawn('git', ['status'], { timeout: 5000 });",
      },
      {
        name: 'should allow namespaced subprocess with timeout',
        code: "import * as cp from 'node:child_process'; cp.exec('git status', { timeout: 5000 });",
      },
      {
        name: 'should allow approved IO wrapper',
        code: 'fetchWithTimeout(url);',
        options: [{ approvedWrapperNames: ['fetchWithTimeout'] }],
      },
      {
        name: 'should skip test files by default',
        filename: 'src/http.test.ts',
        code: 'fetch(url);',
      },
      {
        name: 'should allow regex exec calls without timeout',
        code: 'const match = pattern.exec(value);',
      },
      {
        name: 'should allow superagent timeout chains',
        code: 'superagent.get(url).timeout(5000);',
      },
      {
        name: 'should allow dynamic calls without IO names',
        code: '(getClient())(url);',
      },
      {
        name: 'should ignore imports from non child process modules',
        code: "import { exec } from 'not-child-process'; const value = 1;",
      },
    ],
    invalid: [
      {
        name: 'should report named default Axios without a timeout',
        code: 'import { default as axios } from "axios"; axios(url);',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should report named default Axios config calls without a timeout',
        code: 'import { default as client } from "axios"; client({ url });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should report named default fetch without cancellation',
        code: 'import { default as load } from "node-fetch"; load(url);',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should report named default Got without timeout options',
        code: 'import { default as client } from "got"; client(url);',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should report named default Axios payloads without options',
        code: 'import { default as client } from "axios"; client.post(url, { timeout: 1000 });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject mutations behind nonnull options',
        code: 'const options = { timeout: 1000 }; options.timeout = 0; axios.get(url, options!);',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject mutations behind nested asserted options',
        code: 'const options = { timeout: 1000 }; options.timeout = 0; axios.get(url, (<{ timeout: number }>options) as { timeout: number });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject zero through angle assertion',
        code: 'axios.get(url, { timeout: <number>0 });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject nonfinite values through nonnull assertion',
        code: 'axios.get(url, { timeout: Infinity! });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should report optional imported IO without timeout',
        code: 'import client from "axios"; client?.["get"]?.(url);',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject computed key overriding timeout',
        code: 'axios.get(url, { timeout: 1000, [key]: 0 });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject a later spread disabling timeout',
        code: 'const disabled = { timeout: 0 }; axios.get(url, { timeout: 1000, ...disabled });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject body timeout on optional post',
        code: 'axios?.post?.(url, { timeout: 1000 });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject global NaN',
        code: 'axios.get(url, { timeout: NaN });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject global Infinity',
        code: 'axios.get(url, { timeout: Infinity });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject negative global Infinity',
        code: 'axios.get(url, { timeout: -Infinity });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject aliases of global nonfinite constants',
        code: 'const timeout = Infinity; axios.get(url, { timeout });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject arithmetic using global NaN',
        code: 'axios.get(url, { timeout: NaN * 1000 });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject a global nonfinite Got timeout object',
        code: 'got(url, { timeout: Infinity });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject disabled shadowing initializers',
        code: 'function load() { const Infinity = 0; axios.get(url, { timeout: Infinity }); }',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject global nonfinite nullish fallbacks',
        code: 'axios.get(url, { timeout: NaN ?? 5000 });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject undefined through a local alias',
        code: 'const timeout = undefined; axios.get(url, { timeout });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject cyclic arithmetic timeout aliases without recursion',
        code: 'const delay = delay * 2; axios.get(url, { timeout: delay });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject mutually cyclic fallback timeout aliases without recursion',
        code: 'const first = second ?? 1000; const second = first + 1; axios.get(url, { timeout: first });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject computed zero',
        code: 'axios.get(url, { timeout: 5 - 5 });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject computed negative values',
        code: 'axios.get(url, { timeout: 5 * -1000 });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject division by zero',
        code: 'axios.get(url, { timeout: 1 / 0 });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject computed NaN',
        code: 'axios.get(url, { timeout: 0 / 0 });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject known disabled nullish left operands',
        code: 'axios.get(url, { timeout: 0 ?? 5000 });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject disabled runtime fallback branches',
        code: 'axios.get(url, { timeout: configuredTimeout ?? 0 });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject nullish AND results',
        code: 'axios.get(url, { timeout: null && 5000 });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject disabled numeric AND results',
        code: 'axios.get(url, { timeout: 0 && 5000 });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject string arithmetic',
        code: 'axios.get(url, { timeout: "5" + 1000 });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject boolean arithmetic with runtime operands',
        code: 'axios.get(url, { timeout: duration + false });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject comparison expressions',
        code: 'axios.get(url, { timeout: duration > 0 });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject unsupported unary expressions',
        code: 'axios.get(url, { timeout: !duration });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject invalid literal fallback operands',
        code: 'axios.get(url, { timeout: "disabled" || 5000 });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject nonnumeric fallback expressions',
        code: 'axios.get(url, { timeout: configuredTimeout ?? "disabled" });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject computed numeric Got options',
        code: 'got(url, { timeout: 5 * 1000 });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject unsupported sequence expressions',
        code: 'axios.get(url, { timeout: (log(), 5000) });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject mutated options initializers',
        code: 'const options = { signal }; options.signal = undefined; fetch(url, options);',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject deleted options',
        code: 'const options = { signal }; delete options.signal; fetch(url, options);',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject incremented options',
        code: 'const options = { timeout: 100 }; options.timeout--; axios.get(url, options);',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject AbortSignal for synchronous subprocess calls',
        code: 'spawnSync(cmd, [], { signal });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject unsupported request signals',
        code: 'request(url, { signal });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject bare numeric Got timeouts',
        code: 'got(url, { timeout: 100 });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject body timeouts',
        code: 'axios.post(url, { timeout: 100 });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject fetch timeout properties',
        code: 'fetch(url, { timeout: 100 });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject URL object cancellation',
        code: 'fetch({ signal });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject unrelated third arguments',
        code: 'fetch(url, {}, { signal });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject aliases without cancellation',
        code: 'import http from "axios"; http.get(url);',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject null signals',
        code: 'fetch(url, { signal: null });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject false signals',
        code: 'fetch(url, { signal: false });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject void signals',
        code: 'fetch(url, { signal: void 0 });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject locally disabled cancellation',
        code: 'const signal = undefined; fetch(url, { signal });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject overwritten options',
        code: 'let options = { signal }; options = {}; fetch(url, options);',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject overwritten properties',
        code: 'fetch(url, { signal, signal: undefined });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject later unknown spreads',
        code: 'fetch(url, { signal, ...options });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject computed dynamic keys',
        code: 'fetch(url, { [signal]: controller.signal });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject getters',
        code: 'fetch(url, { get signal() { return controller.signal; } });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject negative timeouts',
        code: 'axios.get(url, { timeout: -1 });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject boolean timeouts',
        code: 'axios.get(url, { timeout: false });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject axios timeout objects',
        code: 'axios.get(url, { timeout: {} });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject empty got timeout objects',
        code: 'got(url, { timeout: {} });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject foreign timeout chains',
        code: 'axios.get(url).timeout(100);',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should check imported undici fetch',
        code: 'import { fetch as read } from "undici"; read(url);',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should reject circular option aliases',
        code: 'const a = b; const b = a; fetch(url, a);',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should report bare fetch',
        code: 'fetch(url);',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should report fetch with an undefined signal',
        code: 'fetch(url, { signal: undefined });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should report an explicitly disabled timeout',
        code: 'axios.get(url, { timeout: 0 });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should report an empty chained timeout call',
        code: 'superagent.get(url).timeout();',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should report a non-timeout chain after an uncancelled request',
        code: 'axios.get(url).then(handle);',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should report a chained timeout with only spread arguments',
        code: 'superagent.get(url).timeout(...args);',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should report an option object containing only spread properties',
        code: 'fetch(url, { ...options });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should report an option object without a named cancellation property',
        code: 'fetch(url, { 0: true });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should report an explicitly undefined timeout',
        code: 'axios.get(url, { timeout: undefined });',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should report axios without timeout',
        code: 'axios.get(url);',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should report direct axios without timeout',
        code: 'axios(url);',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should report got without timeout',
        code: 'got(url);',
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should report spawn without timeout',
        code: "spawn('git', ['status']);",
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should report namespaced subprocess without timeout',
        code: "import * as cp from 'node:child_process'; cp.exec('git status');",
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should report aliased subprocess import without timeout',
        code: "import { exec as run } from 'child_process'; run('git status');",
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should report configured IO function',
        code: 'readRemote(url);',
        options: [{ additionalIoFunctionNames: ['readRemote'] }],
        errors: [{ messageId: 'missingTimeout' }],
      },
      {
        name: 'should report test files when configured',
        filename: 'src/http.test.ts',
        code: 'fetch(url);',
        options: [{ checkTests: true }],
        errors: [{ messageId: 'missingTimeout' }],
      },
    ],
  });
});
