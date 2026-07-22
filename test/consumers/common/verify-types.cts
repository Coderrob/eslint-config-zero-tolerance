import plugin = require('@coderrob/eslint-plugin-zero-tolerance');
import configs = require('@coderrob/eslint-config-zero-tolerance');
import recommended = require('@coderrob/eslint-config-zero-tolerance/recommended');
import strict = require('@coderrob/eslint-config-zero-tolerance/strict');

plugin.rules['no-date-now'];
void configs.recommended;
void configs.strict;
void recommended;
void strict;
