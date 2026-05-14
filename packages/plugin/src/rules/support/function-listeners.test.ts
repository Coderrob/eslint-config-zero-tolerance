import {
  createFunctionNodeEnterExitListeners,
  createFunctionNodeListeners,
} from './function-listeners';

const ARROW_FUNCTION_CALL_INDEX = 1;
const DECLARATION_FUNCTION_CALL_INDEX = 2;
const EXPRESSION_FUNCTION_CALL_INDEX = 3;
const STANDARD_FUNCTION_NODE_COUNT = 3;

describe('function-listeners', () => {
  describe('createFunctionNodeListeners', () => {
    it('should create listeners for all standard function-like nodes', () => {
      const listener = jest.fn();
      const ruleListener = createFunctionNodeListeners(listener);
      const arrowNode = { type: 'ArrowFunctionExpression' } as unknown;
      const declarationNode = { type: 'FunctionDeclaration' } as unknown;
      const expressionNode = { type: 'FunctionExpression' } as unknown;

      ruleListener.ArrowFunctionExpression?.(arrowNode);
      ruleListener.FunctionDeclaration?.(declarationNode);
      ruleListener.FunctionExpression?.(expressionNode);

      expect(listener).toHaveBeenCalledTimes(STANDARD_FUNCTION_NODE_COUNT);
      expect(listener).toHaveBeenNthCalledWith(ARROW_FUNCTION_CALL_INDEX, arrowNode);
      expect(listener).toHaveBeenNthCalledWith(DECLARATION_FUNCTION_CALL_INDEX, declarationNode);
      expect(listener).toHaveBeenNthCalledWith(EXPRESSION_FUNCTION_CALL_INDEX, expressionNode);
    });
  });

  describe('createFunctionNodeEnterExitListeners', () => {
    it('should create enter and exit listeners for all standard function-like nodes', () => {
      const enterListener = jest.fn();
      const exitListener = jest.fn();
      const ruleListener = createFunctionNodeEnterExitListeners(enterListener, exitListener);
      const arrowNode = { type: 'ArrowFunctionExpression' } as unknown;
      const declarationNode = { type: 'FunctionDeclaration' } as unknown;
      const expressionNode = { type: 'FunctionExpression' } as unknown;

      ruleListener.ArrowFunctionExpression?.(arrowNode);
      ruleListener.FunctionDeclaration?.(declarationNode);
      ruleListener.FunctionExpression?.(expressionNode);
      ruleListener['ArrowFunctionExpression:exit']?.(arrowNode);
      ruleListener['FunctionDeclaration:exit']?.(declarationNode);
      ruleListener['FunctionExpression:exit']?.(expressionNode);

      expect(enterListener).toHaveBeenCalledTimes(STANDARD_FUNCTION_NODE_COUNT);
      expect(enterListener).toHaveBeenNthCalledWith(ARROW_FUNCTION_CALL_INDEX, arrowNode);
      expect(enterListener).toHaveBeenNthCalledWith(
        DECLARATION_FUNCTION_CALL_INDEX,
        declarationNode,
      );
      expect(enterListener).toHaveBeenNthCalledWith(EXPRESSION_FUNCTION_CALL_INDEX, expressionNode);
      expect(exitListener).toHaveBeenCalledTimes(STANDARD_FUNCTION_NODE_COUNT);
      expect(exitListener).toHaveBeenNthCalledWith(ARROW_FUNCTION_CALL_INDEX, arrowNode);
      expect(exitListener).toHaveBeenNthCalledWith(
        DECLARATION_FUNCTION_CALL_INDEX,
        declarationNode,
      );
      expect(exitListener).toHaveBeenNthCalledWith(EXPRESSION_FUNCTION_CALL_INDEX, expressionNode);
    });
  });
});
