import ts from 'typescript';

/**
 * Finds syntax nodes matching a predicate without inspecting comments or strings.
 *
 * @param node - Syntax subtree to inspect.
 * @param predicate - Node selection predicate.
 * @returns Matching syntax nodes.
 */
function findNodes(node, predicate) {
  const matches = predicate(node) ? [node] : [];
  ts.forEachChild(node, (child) => {
    matches.push(...findNodes(child, predicate));
  });
  return matches;
}

/**
 * Reads an explicitly assigned object property.
 *
 * @param node - Object expression to inspect.
 * @param name - Property name.
 * @returns Property initializer when present.
 */
export function getFixtureProperty(node, name) {
  if (!node || !ts.isObjectLiteralExpression(node)) return undefined;
  return node.properties.find(
    (property) =>
      ts.isPropertyAssignment(property) && property.name.getText().replace(/['"]/gu, '') === name,
  )?.initializer;
}

/**
 * Checks for a RuleTester run call with an inline configuration.
 *
 * @param node - Syntax node to inspect.
 * @returns Whether the node is a rule test invocation.
 */
function isRuleRun(node) {
  return (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === 'run'
  );
}

/**
 * Extracts fixture groups from actual RuleTester configurations.
 *
 * @param source - Test source text.
 * @returns Parsed source and fixture arrays grouped by outcome.
 */
export function readRuleFixtures(source) {
  const sourceFile = ts.createSourceFile('rule.test.ts', source, ts.ScriptTarget.Latest, true);
  const configurations = findNodes(sourceFile, isRuleRun).map((call) => call.arguments[2]);
  const groups = Object.fromEntries(
    ['valid', 'invalid'].map((name) => [
      name,
      configurations.flatMap((configuration) =>
        getArrayElements(getFixtureProperty(configuration, name)),
      ),
    ]),
  );
  return { sourceFile, groups };
}

/**
 * Returns array elements only for literal arrays.
 *
 * @param node - Possible array expression.
 * @returns Literal array elements.
 */
function getArrayElements(node) {
  return node && ts.isArrayLiteralExpression(node) ? [...node.elements] : [];
}

/**
 * Reads a fixture's static string field.
 *
 * @param fixture - Fixture object.
 * @param name - Field name.
 * @returns Static string value or undefined.
 */
export function getFixtureString(fixture, name) {
  const value = getFixtureProperty(fixture, name);
  return value && ts.isStringLiteralLike(value) ? value.text : undefined;
}

/**
 * Checks an implementation's actual fixable metadata.
 *
 * @param source - Implementation source text.
 * @returns Whether code or whitespace fixes are declared.
 */
export function hasFixableMetadata(source) {
  const sourceFile = ts.createSourceFile('rule.ts', source, ts.ScriptTarget.Latest, true);
  return findNodes(sourceFile, ts.isObjectLiteralExpression).some((node) =>
    ['code', 'whitespace'].includes(getFixtureString(node, 'fixable')),
  );
}

/**
 * Checks whether an invalid fixture asserts at least one diagnostic.
 *
 * @param fixture - Invalid fixture object.
 * @returns Whether a nonempty errors array or positive count is supplied.
 */
export function hasFixtureErrors(fixture) {
  const errors = getFixtureProperty(fixture, 'errors');
  if (errors && ts.isNumericLiteral(errors)) return Number(errors.text) > 0;
  return getArrayElements(errors).length > 0;
}
