import assert from 'node:assert/strict';
import plugin from '@coderrob/eslint-plugin-zero-tolerance';
import configs, {
  legacyRecommended,
  legacyStrict,
  recommended as namedRecommended,
  strict as namedStrict,
} from '@coderrob/eslint-config-zero-tolerance';
import recommended from '@coderrob/eslint-config-zero-tolerance/recommended';
import strict from '@coderrob/eslint-config-zero-tolerance/strict';

assert.equal(plugin.meta.name, '@coderrob/eslint-plugin-zero-tolerance');
assert.ok(plugin.rules['no-date-now']);
assert.equal(configs.recommended, namedRecommended);
assert.equal(configs.strict, namedStrict);
assert.equal(configs.legacyRecommended, legacyRecommended);
assert.equal(configs.legacyStrict, legacyStrict);
assert.ok(recommended.rules['zero-tolerance/no-date-now']);
assert.ok(strict.rules['zero-tolerance/no-date-now']);
