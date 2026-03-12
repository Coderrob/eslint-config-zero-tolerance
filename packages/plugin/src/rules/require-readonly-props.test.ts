import * as tsParser from '@typescript-eslint/parser';
import type { RuleTesterConfig } from '@typescript-eslint/rule-tester';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { requireReadonlyProps } from './require-readonly-props';

const ruleTestConfig: RuleTesterConfig = {
  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
    parser: tsParser,
  },
};
const ruleTester = new RuleTester(ruleTestConfig);

ruleTester.run('require-readonly-props', requireReadonlyProps, {
  valid: [
    {
      name: 'should allow component with Readonly-wrapped props reference',
      code: `
        type Props = { count: number };
        function Counter(props: Readonly<Props>) {
          return <div>{props.count}</div>;
        }
      `,
    },
    {
      name: 'should allow component with readonly inline props type',
      code: `
        function Greeting(props: { readonly name: string }) {
          return <div>{props.name}</div>;
        }
      `,
    },
    {
      name: 'should allow component with readonly destructured inline props',
      code: `
        const Greeting = ({ name }: { readonly name: string }) => <div>{name}</div>;
      `,
    },
    {
      name: 'should allow non-component PascalCase function without JSX return',
      code: `
        function ParseInput(props: { value: string }) {
          return props.value.trim();
        }
      `,
    },
    {
      name: 'should allow lowercase jsx-returning function',
      code: `
        function render(props: { name: string }) {
          return <div>{props.name}</div>;
        }
      `,
    },
    {
      name: 'should allow component without props',
      code: 'const Empty = () => <div />;',
    },
    {
      name: 'should allow function-expression component with readonly props',
      code: `
        type Props = { name: string };
        const Greeting = function (props: Readonly<Props>) {
          return <div>{props.name}</div>;
        };
      `,
    },
    {
      name: 'should allow unnamed jsx function expression in object pattern assignment',
      code: `
        type Props = { name: string };
        const { Greeting } = {
          Greeting: (props: Props) => <div>{props.name}</div>,
        };
      `,
    },
    {
      name: 'should allow unnamed jsx iife function',
      code: `
        ((props: { name: string }) => <div>{props.name}</div>)({ name: 'A' });
      `,
    },
    {
      name: 'should allow component returning jsx wrapped in as expression',
      code: `
        type Props = { name: string };
        const Greeting = (props: Readonly<Props>) => (<div>{props.name}</div> as JSX.Element);
      `,
    },
    {
      name: 'should allow component returning jsx wrapped in non-null expression',
      code: `
        type Props = { name: string };
        const Greeting = (props: Readonly<Props>) => (<div>{props.name}</div>)!;
      `,
    },
    {
      name: 'should allow component returning jsx wrapped in satisfies expression',
      code: `
        type Props = { name: string };
        const Greeting = (props: Readonly<Props>) =>
          (<div>{props.name}</div> satisfies JSX.Element);
      `,
    },
    {
      name: 'should allow component with empty return branch and readonly props',
      code: `
        type Props = { name: string };
        function Greeting(props: Readonly<Props>) {
          if (props.name.length === 0) {
            return;
          }
          return <div>{props.name}</div>;
        }
      `,
    },
    {
      name: 'should allow component with explicit this parameter followed by readonly props',
      code: `
        type Props = { name: string };
        function Greeting(this: void, props: Readonly<Props>) {
          return <div>{props.name}</div>;
        }
      `,
    },
    {
      name: 'should allow component with explicit this parameter and no props',
      code: `
        function Empty(this: void) {
          return <div />;
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'should disallow mutable props type reference on function declaration',
      code: `
        type Props = { count: number };
        function Counter(props: Props) {
          return <div>{props.count}</div>;
        }
      `,
      errors: [{ messageId: 'requireReadonlyProps' }],
    },
    {
      name: 'should disallow mutable props type on arrow component',
      code: `
        type Props = { name: string };
        const Greeting = (props: Props) => <div>{props.name}</div>;
      `,
      errors: [{ messageId: 'requireReadonlyProps' }],
    },
    {
      name: 'should disallow inline type literal props without readonly members',
      code: `
        const Greeting = (props: { name: string }) => <div>{props.name}</div>;
      `,
      errors: [{ messageId: 'requireReadonlyProps' }],
    },
    {
      name: 'should disallow missing props type annotation on jsx component',
      code: `
        const Greeting = (props) => <div>{props.name}</div>;
      `,
      errors: [{ messageId: 'requireReadonlyProps' }],
    },
    {
      name: 'should disallow destructured props without readonly wrapper',
      code: `
        type Props = { name: string };
        const Greeting = ({ name }: Props) => <div>{name}</div>;
      `,
      errors: [{ messageId: 'requireReadonlyProps' }],
    },
    {
      name: 'should disallow mutable props on function-expression component',
      code: `
        type Props = { name: string };
        const Greeting = function (props: Props) {
          return <div>{props.name}</div>;
        };
      `,
      errors: [{ messageId: 'requireReadonlyProps' }],
    },
    {
      name: 'should disallow array pattern assignment parameter on component',
      code: `
        const Greeting = ([name] = ['A']) => <div>{name}</div>;
      `,
      errors: [{ messageId: 'requireReadonlyProps' }],
    },
    {
      name: 'should disallow array pattern parameter on component',
      code: `
        const Greeting = ([name]: string[]) => <div>{name}</div>;
      `,
      errors: [{ messageId: 'requireReadonlyProps' }],
    },
    {
      name: 'should disallow qualified readonly-like props reference',
      code: `
        namespace Types {
          export type Readonly<T> = T;
        }
        type Props = { name: string };
        const Greeting = (props: Types.Readonly<Props>) => <div>{props.name}</div>;
      `,
      errors: [{ messageId: 'requireReadonlyProps' }],
    },
    {
      name: 'should disallow assignment-pattern identifier props without annotation',
      code: `
        const Greeting = (props = { name: 'A' }) => <div>{props.name}</div>;
      `,
      errors: [{ messageId: 'requireReadonlyProps' }],
    },
    {
      name: 'should disallow mutable props when jsx return is wrapped in satisfies expression',
      code: `
        type Props = { name: string };
        const Greeting = (props: Props) =>
          (<div>{props.name}</div> satisfies JSX.Element);
      `,
      errors: [{ messageId: 'requireReadonlyProps' }],
    },
    {
      name: 'should disallow non-reference props annotation',
      code: `
        const Greeting = (props: string) => <div>{props}</div>;
      `,
      errors: [{ messageId: 'requireReadonlyProps' }],
    },
    {
      name: 'should disallow mutable props following explicit this parameter',
      code: `
        type Props = { name: string };
        function Greeting(this: void, props: Props) {
          return <div>{props.name}</div>;
        }
      `,
      errors: [{ messageId: 'requireReadonlyProps' }],
    },
  ],
});
