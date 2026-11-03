import * as parser from '@typescript-eslint/parser';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { requireErrorCause } from './require-error-cause';
const tester = new RuleTester({ languageOptions: { parser } });
describe('require-error-cause', () => {
  tester.run('require-error-cause', requireErrorCause, {
    valid: [
      {
        name: 'should allow reading a cause through asserted options',
        code: 'try { work(); } catch (error) { const options = { cause: error }; const original = options!.cause; throw new Error("failed", options); }',
      },
      {
        name: 'should preserve angle asserted cause',
        code: 'try { run(); } catch (error) { throw new Error("failed", { cause: <unknown>error }); }',
      },
      {
        name: 'should preserve nonnull cause',
        code: 'try { run(); } catch (error) { throw new Error("failed", { cause: error! }); }',
      },
      {
        name: 'should preserve nested satisfies cause',
        code: 'try { run(); } catch (error) { throw new Error("failed", { cause: (error as unknown) satisfies unknown }); }',
      },
      {
        name: 'should preserve computed static cause key',
        code: 'try { run(); } catch (error) { throw new Error("failed", { ["cause"]: error }); }',
      },
      {
        name: 'should preserve aliases captured before reassignment',
        code: 'try { run(); } catch (error) { const original = error; error = other; throw new Error("failed", { cause: original }); }',
      },
      {
        name: 'should preserve options captured before reassignment',
        code: 'try { run(); } catch (error) { const options = { cause: error }; error = other; throw new Error("failed", options); }',
      },
      {
        name: 'should preserve chained aliases captured before reassignment',
        code: 'try { run(); } catch (error) { const first = error; error = other; const second = first; throw new Error("failed", { cause: second }); }',
      },
      {
        name: 'should ignore later writes after the cause was captured',
        code: 'try { run(); } catch (error) { if (flag) throw new Error("failed", { cause: error }); error = other; }',
      },
      {
        name: 'should preserve factory aliases captured before reassignment',
        code: 'try { run(); } catch (error) { const original = error; error = other; throw wrap("failed", original); }',
        options: [{ errorFactoryNames: ['wrap'] }],
      },
      {
        name: 'should allow original rethrow',
        code: 'try { run(); } catch (error) { throw error; }',
      },
      {
        name: 'should allow native cause',
        code: 'try { run(); } catch (error) { throw new Error("failed", { cause: error }); }',
      },
      {
        name: 'should allow callable Error',
        code: 'try { run(); } catch (error) { throw Error("failed", { cause: error }); }',
      },
      {
        name: 'should allow local cause aliases',
        code: 'try { run(); } catch (error) { const original = error; const options = { cause: original }; throw new TypeError("failed", options); }',
      },
      {
        name: 'should allow aggregate cause',
        code: 'try { run(); } catch (error) { throw new AggregateError([], "failed", { cause: error }); }',
      },
      {
        name: 'should allow configured factories',
        code: 'try { run(); } catch (error) { throw wrap("failed", error); }',
        options: [{ errorFactoryNames: ['wrap'] }],
      },
      { name: 'should ignore throws outside catch', code: 'throw new Error("failed");' },
      {
        name: 'should ignore deferred functions',
        code: 'try { run(); } catch (error) { const later = () => { throw new Error("later"); }; }',
      },
      {
        name: 'should ignore shadowed constructors',
        code: 'function run(Error) { try { work(); } catch (error) { throw new Error("custom"); } }',
      },
      {
        name: 'should ignore custom constructors',
        code: 'try { run(); } catch (error) { throw new CustomError("custom"); }',
      },
      {
        name: 'should ignore member constructors',
        code: 'try { run(); } catch (error) { throw new errors.CustomError("custom"); }',
      },
    ],
    invalid: [
      {
        name: 'should reject overwritten cause through asserted receiver',
        code: 'try { work(); } catch (error) { const options = { cause: error }; (options as { cause: unknown }).cause = other; throw new Error("failed", options); }',
        errors: [{ messageId: 'missingCause' }],
      },
      {
        name: 'should reject overwritten cause through nonnull receiver',
        code: 'try { work(); } catch (error) { const options = { cause: error }; options!.cause = other; throw new Error("failed", options); }',
        errors: [{ messageId: 'missingCause' }],
      },
      {
        name: 'should reject deleted cause through nested assertions',
        code: 'try { work(); } catch (error) { const options = { cause: error }; delete ((options as { cause: unknown })!).cause; throw new Error("failed", options); }',
        errors: [{ messageId: 'missingCause' }],
      },
      {
        name: 'should reject overwritten cause behind asserted options',
        code: 'try { run(); } catch (error) { const options = { cause: error }; options.cause = other; throw new Error("failed", options!); }',
        errors: [{ messageId: 'missingCause' }],
      },
      {
        name: 'should reject an asserted unrelated cause',
        code: 'try { run(); } catch (error) { throw new Error("failed", { cause: other as unknown }); }',
        errors: [{ messageId: 'missingCause' }],
      },
      {
        name: 'should reject a nonnull unrelated cause',
        code: 'try { run(); } catch (error) { throw new Error("failed", { cause: other! }); }',
        errors: [{ messageId: 'missingCause' }],
      },
      {
        name: 'should reject overwritten cause from spread',
        code: 'try { run(); } catch (error) { throw new Error("failed", { cause: error, ...{ cause: other } }); }',
        errors: [{ messageId: 'missingCause' }],
      },
      {
        name: 'should preserve nearest nested catch identity',
        code: 'try { run(); } catch (outer) { try { work(); } catch (inner) { throw new Error("failed", { cause: outer }); } }',
        errors: [{ messageId: 'missingCause' }],
      },
      {
        name: 'should reject reassigned catch variables',
        code: 'try { run(); } catch (error) { error = new Error("replacement"); throw new Error("failed", { cause: error }); }',
        errors: [{ messageId: 'missingCause' }],
      },
      {
        name: 'should reject aliases captured after reassignment',
        code: 'try { run(); } catch (error) { error = other; const alias = error; throw new Error("failed", { cause: alias }); }',
        errors: [{ messageId: 'missingCause' }],
      },
      {
        name: 'should reject conditional reassignments before cause reads',
        code: 'try { run(); } catch (error) { if (flag) error = other; throw new Error("failed", { cause: error }); }',
        errors: [{ messageId: 'missingCause' }],
      },
      {
        name: 'should reject destructuring writes to catch variables',
        code: 'try { run(); } catch (error) { ({ error } = other); throw new Error("failed", { cause: error }); }',
        errors: [{ messageId: 'missingCause' }],
      },
      {
        name: 'should reject reassigned errors passed to factories',
        code: 'try { run(); } catch (error) { error = other; throw wrap("failed", error); }',
        options: [{ errorFactoryNames: ['wrap'] }],
        errors: [{ messageId: 'missingCause' }],
      },
      {
        name: 'should report lost cause',
        code: 'try { run(); } catch (error) { throw new Error("failed"); }',
        errors: [{ messageId: 'missingCause' }],
      },
      {
        name: 'should report wrong cause',
        code: 'try { run(); } catch (error) { throw new TypeError("failed", { cause: other }); }',
        errors: [{ messageId: 'missingCause' }],
      },
      {
        name: 'should report missing cause property',
        code: 'try { run(); } catch (error) { throw new Error("failed", {}); }',
        errors: [{ messageId: 'missingCause' }],
      },
      {
        name: 'should report missing catch binding',
        code: 'try { run(); } catch { throw new Error("failed"); }',
        errors: [{ messageId: 'missingCause' }],
      },
      {
        name: 'should report destructured catch binding',
        code: 'try { run(); } catch ({ message }) { throw new Error(message, { cause: message }); }',
        errors: [{ messageId: 'missingCause' }],
      },
      {
        name: 'should report shadowed catch binding',
        code: 'try { run(); } catch (error) { { const error = other; throw new Error("failed", { cause: error }); } }',
        errors: [{ messageId: 'missingCause' }],
      },
      {
        name: 'should report wrong aggregate options position',
        code: 'try { run(); } catch (error) { throw new AggregateError([], { cause: error }); }',
        errors: [{ messageId: 'missingCause' }],
      },
      {
        name: 'should report factory dropping cause',
        code: 'try { run(); } catch (error) { throw wrap("failed"); }',
        options: [{ errorFactoryNames: ['wrap'] }],
        errors: [{ messageId: 'missingCause' }],
      },
      {
        name: 'should report inner error wrapping outer cause',
        code: 'try { run(); } catch (outer) { try { work(); } catch (inner) { throw new Error("failed", { cause: outer }); } }',
        errors: [{ messageId: 'missingCause' }],
      },
    ],
  });
});
