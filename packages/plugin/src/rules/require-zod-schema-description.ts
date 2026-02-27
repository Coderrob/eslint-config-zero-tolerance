import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import { isCallExpressionNode, isIdentifierNode, isMemberExpressionNode } from '../ast-guards';
import { RULE_CREATOR_URL } from '../constants';
import { ZOD_DESCRIBE_METHOD, ZOD_IDENTIFIER } from '../rule-constants';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

/**
 * Returns member expression from a call expression, when present.
 * @param node - The call expression node.
 * @returns The member expression callee if present, null otherwise.
 */
function getMemberCallee(node: TSESTree.CallExpression): TSESTree.MemberExpression | null {
  if (!isMemberExpressionNode(node.callee)) {
    return null;
  }
  return node.callee;
}

/**
 * Returns true when member property is an identifier with the given name.
 * @param member - The member expression to check.
 * @param propertyName - The property name to match.
 * @returns True if the member property matches the given name, false otherwise.
 */
function isPropertyNamed(member: TSESTree.MemberExpression, propertyName: string): boolean {
  if (!isIdentifierNode(member.property)) {
    return false;
  }
  return member.property.name === propertyName;
}

/**
 * Returns true when member expression starts from `z.<schema>`.
 * @param member - The member expression to check.
 * @returns True if the member starts from a Zod root, false otherwise.
 */
function isZodRootMember(member: TSESTree.MemberExpression): boolean {
  if (!isIdentifierNode(member.object)) {
    return false;
  }
  return member.object.name === ZOD_IDENTIFIER;
}

/**
 * Returns next inner call in a chained call expression, or null at chain start.
 * @param node - The call expression to analyze.
 * @returns The inner call expression if present, null otherwise.
 */
function getInnerCall(node: TSESTree.CallExpression): TSESTree.CallExpression | null {
  const member = getMemberCallee(node);
  if (member === null) {
    return null;
  }
  return isCallExpressionNode(member.object) ? member.object : null;
}

/**
 * Walks inward through call chain and checks whether `.describe()` exists.
 * @param root - The root call expression to start walking from.
 * @returns True if a describe call is found in the chain, false otherwise.
 */
function hasDescribeCall(root: TSESTree.CallExpression): boolean {
  let current: TSESTree.CallExpression | null = root;
  while (current !== null) {
    const status = getDescribeCallStatus(current);
    if (status !== null) {
      return status;
    }
    current = getInnerCall(current);
  }
  return false;
}

/**
 * Walks inward through call chain and checks whether it originates from `z.<schema>`.
 * @param root - The root call expression to start walking from.
 * @returns True if the chain originates from a Zod root, false otherwise.
 */
function hasZodRootCall(root: TSESTree.CallExpression): boolean {
  let current: TSESTree.CallExpression | null = root;
  while (current !== null) {
    const status = getZodRootStatus(current);
    if (status !== null) {
      return status;
    }
    current = getInnerCall(current);
  }
  return false;
}

/**
 * Returns describe-call status for current chain item; null means continue walking.
 * @param node - The call expression to check.
 * @returns True if describe call found, false if not a describe call, null to continue.
 */
function getDescribeCallStatus(node: TSESTree.CallExpression): boolean | null {
  const member = getMemberCallee(node);
  if (member === null) {
    return false;
  }
  return isPropertyNamed(member, ZOD_DESCRIBE_METHOD) ? true : null;
}

/**
 * Returns zod-root status for current chain item; null means continue walking.
 * @param node - The call expression to check.
 * @returns True if Zod root found, false if not a Zod root, null to continue.
 */
function getZodRootStatus(node: TSESTree.CallExpression): boolean | null {
  const member = getMemberCallee(node);
  if (member === null) {
    return false;
  }
  return isZodRootMember(member) ? true : null;
}

/**
 * ESLint rule that enforces Zod schema descriptions.
 */
export const requireZodSchemaDescription = createRule({
  name: 'require-zod-schema-description',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce that Zod schemas have .describe() called',
    },
    messages: {
      requireZodSchemaDescription: 'Zod schema should have .describe() called',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const checkVariableDeclarator = (node: TSESTree.VariableDeclarator): void => {
      const missingDescribeInit = getMissingDescribeInit(node);
      if (missingDescribeInit === null) {
        return;
      }
      context.report({
        node: missingDescribeInit,
        messageId: 'requireZodSchemaDescription',
      });
    };

    return {
      VariableDeclarator: checkVariableDeclarator,
    };
  },
});

/** Returns call-expression init when it is a zod schema missing `.describe()`. */
function getMissingDescribeInit(node: TSESTree.VariableDeclarator): TSESTree.CallExpression | null {
  if (!isCallExpressionNode(node.init)) {
    return null;
  }
  return isUndescribedZodCall(node.init) ? node.init : null;
}

/** Returns true when call creates zod schema chain without `.describe()`. */
function isUndescribedZodCall(node: TSESTree.CallExpression): boolean {
  if (!hasZodRootCall(node)) {
    return false;
  }
  return !hasDescribeCall(node);
}

export default requireZodSchemaDescription;
