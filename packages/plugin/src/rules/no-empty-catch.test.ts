import { ruleTester } from '../test-helper';
import { noEmptyCatch } from './no-empty-catch';

ruleTester.run('no-empty-catch', noEmptyCatch, {
  valid: [
    {
      name: 'should pass when catch block handles the error',
      code: 'try { fn(); } catch (e) { console.error(e); }',
    },
    {
      name: 'should pass when catch block re-throws the error',
      code: 'try { fn(); } catch (e) { throw e; }',
    },
    {
      name: 'should pass when catch block logs and returns',
      code: 'try { fn(); } catch (e) { logger.log(e); return null; }',
    },
    {
      name: 'should pass for binding-less catch with body',
      code: 'try { fn(); } catch { throw new Error("failed"); }',
    },
  ],
  invalid: [
    {
      name: 'should error for empty catch block with binding',
      code: 'try { fn(); } catch (e) {}',
      errors: [{ messageId: 'emptyCatch' }],
    },
    {
      name: 'should error for empty binding-less catch block',
      code: 'try { fn(); } catch {}',
      errors: [{ messageId: 'emptyCatch' }],
    },
    {
      name: 'should error for empty catch block with finally',
      code: 'try { a(); } catch (err) {} finally { cleanup(); }',
      errors: [{ messageId: 'emptyCatch' }],
    },
    {
      name: 'should error for two consecutive try-catch blocks with empty catches',
      code: 'try { a(); } catch (e) {} try { b(); } catch (e) {}',
      errors: [{ messageId: 'emptyCatch' }, { messageId: 'emptyCatch' }],
    },
  ],
});
