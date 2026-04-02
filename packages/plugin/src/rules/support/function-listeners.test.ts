import {
  createFunctionNodeEnterExitListeners,
  createFunctionNodeListeners,
} from './function-listeners';

describe('function-listeners', () => {
  describe('createFunctionNodeListeners', () => {
    it('should create listeners for all standard function-like nodes', () => {
      const listener = jest.fn();
      const ruleListener = createFunctionNodeListeners(listener);
      const arrowNode = { type: 'ArrowFunctionExpression' } as any;
      const declarationNode = { type: 'FunctionDeclaration' } as any;
      const expressionNode = { type: 'FunctionExpression' } as any;

      ruleListener.ArrowFunctionExpression?.(arrowNode);
      ruleListener.FunctionDeclaration?.(declarationNode);
      ruleListener.FunctionExpression?.(expressionNode);

      expect(listener).toHaveBeenCalledTimes(3);
      expect(listener).toHaveBeenNthCalledWith(1, arrowNode);
      expect(listener).toHaveBeenNthCalledWith(2, declarationNode);
      expect(listener).toHaveBeenNthCalledWith(3, expressionNode);
    });
  });

  describe('createFunctionNodeEnterExitListeners', () => {
    it('should create enter and exit listeners for all standard function-like nodes', () => {
      const enterListener = jest.fn();
      const exitListener = jest.fn();
      const ruleListener = createFunctionNodeEnterExitListeners(enterListener, exitListener);
      const arrowNode = { type: 'ArrowFunctionExpression' } as any;
      const declarationNode = { type: 'FunctionDeclaration' } as any;
      const expressionNode = { type: 'FunctionExpression' } as any;

      ruleListener.ArrowFunctionExpression?.(arrowNode);
      ruleListener.FunctionDeclaration?.(declarationNode);
      ruleListener.FunctionExpression?.(expressionNode);
      ruleListener['ArrowFunctionExpression:exit']?.(arrowNode);
      ruleListener['FunctionDeclaration:exit']?.(declarationNode);
      ruleListener['FunctionExpression:exit']?.(expressionNode);

      expect(enterListener).toHaveBeenCalledTimes(3);
      expect(enterListener).toHaveBeenNthCalledWith(1, arrowNode);
      expect(enterListener).toHaveBeenNthCalledWith(2, declarationNode);
      expect(enterListener).toHaveBeenNthCalledWith(3, expressionNode);
      expect(exitListener).toHaveBeenCalledTimes(3);
      expect(exitListener).toHaveBeenNthCalledWith(1, arrowNode);
      expect(exitListener).toHaveBeenNthCalledWith(2, declarationNode);
      expect(exitListener).toHaveBeenNthCalledWith(3, expressionNode);
    });
  });
});
