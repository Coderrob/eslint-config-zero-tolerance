import { ruleTester } from '../testing/test-helper';
import { noRawSqlInterpolation } from './no-raw-sql-interpolation';

ruleTester.run('no-raw-sql-interpolation', noRawSqlInterpolation, {
  valid: [
    {
      name: 'should allow parameterized query calls',
      code: "db.query('select * from users where id = ?', [id]);",
    },
    {
      name: 'should allow configured safe SQL tag interpolation',
      code: 'const query = sql`select * from users where id = ${id}`;',
    },
    {
      name: 'should allow non SQL template usage',
      code: 'const message = `hello ${name}`;',
    },
    {
      name: 'should allow custom safe tag interpolation',
      code: 'safeSql`select * from users where id = ${id}`;',
      options: [{ allowedTags: ['safeSql'] }],
    },
    {
      name: 'should allow String raw templates',
      code: 'const path = String.raw`C:\\\\${folder}`;',
    },
    {
      name: 'should allow SQL sinks without arguments',
      code: 'db.query();',
    },
    {
      name: 'should allow spread query arguments',
      code: 'db.query(...args);',
    },
    {
      name: 'should allow interpolated templates in non SQL calls',
      code: 'logger.info(`user ${id}`);',
    },
    {
      name: 'should allow dynamic callees without static SQL sink names',
      code: '(getQuery())(`select ${id}`);',
    },
  ],
  invalid: [
    {
      name: 'should report interpolated template query call',
      code: 'db.query(`select * from users where id = ${id}`);',
      errors: [{ messageId: 'rawSqlInterpolation' }],
    },
    {
      name: 'should report concatenated execute call',
      code: "db.execute('delete from users where id = ' + id);",
      errors: [{ messageId: 'rawSqlInterpolation' }],
    },
    {
      name: 'should report query raw unsafe helper',
      code: "prisma.$queryRawUnsafe('select * from users');",
      errors: [{ messageId: 'unsafeRawSql' }],
    },
    {
      name: 'should report execute raw unsafe helper',
      code: "prisma.$executeRawUnsafe('delete from users');",
      errors: [{ messageId: 'unsafeRawSql' }],
    },
    {
      name: 'should report member raw tag interpolation',
      code: 'prisma.$queryRaw`select * from users where id = ${id}`;',
      errors: [{ messageId: 'rawSqlInterpolation' }],
    },
    {
      name: 'should report direct unsafe raw helper',
      code: "queryRawUnsafe('select * from users');",
      errors: [{ messageId: 'unsafeRawSql' }],
    },
    {
      name: 'should report configured additional sink names',
      code: 'db.runSql(`select ${id}`);',
      options: [{ additionalSinkNames: ['runSql'] }],
      errors: [{ messageId: 'rawSqlInterpolation' }],
    },
  ],
});
