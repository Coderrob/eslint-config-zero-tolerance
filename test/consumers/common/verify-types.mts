import plugin from '@coderrob/eslint-plugin-zero-tolerance';
import configs, {
  legacyRecommended,
  legacyStrict,
  recommended as namedRecommended,
  strict as namedStrict,
} from '@coderrob/eslint-config-zero-tolerance';
import recommended from '@coderrob/eslint-config-zero-tolerance/recommended';
import strict from '@coderrob/eslint-config-zero-tolerance/strict';

plugin.rules['no-date-now'];
configs.recommended === namedRecommended;
configs.strict === namedStrict;
configs.legacyRecommended === legacyRecommended;
configs.legacyStrict === legacyStrict;
void recommended;
void strict;
