const assert = require('node:assert/strict');
const plugin = require('@coderrob/eslint-plugin-zero-tolerance');
const configs = require('@coderrob/eslint-config-zero-tolerance');
const recommended = require('@coderrob/eslint-config-zero-tolerance/recommended');
const strict = require('@coderrob/eslint-config-zero-tolerance/strict');

assert.equal(plugin.meta.name, '@coderrob/eslint-plugin-zero-tolerance');
assert.ok(plugin.rules['no-date-now']);
assert.ok(configs.recommended.rules['zero-tolerance/no-date-now']);
assert.ok(configs.strict.rules['zero-tolerance/no-date-now']);
assert.ok(configs.legacyRecommended.rules['@coderrob/zero-tolerance/no-date-now']);
assert.ok(configs.legacyStrict.rules['@coderrob/zero-tolerance/no-date-now']);
assert.ok((recommended.default ?? recommended).rules['zero-tolerance/no-date-now']);
assert.ok((strict.default ?? strict).rules['zero-tolerance/no-date-now']);
