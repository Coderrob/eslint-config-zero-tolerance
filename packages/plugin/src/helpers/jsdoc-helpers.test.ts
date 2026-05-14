import { AST_NODE_TYPES, AST_TOKEN_TYPES } from '@typescript-eslint/utils';
import {
  getJsdocComment,
  getLineIndentation,
  getParentOwnedTargetNode,
  getTargetNode,
  getVariableOwnedTargetNode,
  isJsdocBlockComment,
  isParentOwnedTargetType,
  isStandaloneLineTarget,
} from './jsdoc-helpers';

const INDENTED_COLUMN = 2;
const EXPORT_PREFIX_COLUMN = 8;

describe('jsdoc-helpers', () => {
  // ── isJsdocBlockComment ──────────────────────────────────────────────────

  describe('isJsdocBlockComment', () => {
    it('should return true for a block comment starting with *', () => {
      const comment = { type: AST_TOKEN_TYPES.Block, value: '* description' } as unknown;
      expect(isJsdocBlockComment(comment)).toBe(true);
    });

    it('should return false for a block comment not starting with *', () => {
      const comment = { type: AST_TOKEN_TYPES.Block, value: ' regular block' } as unknown;
      expect(isJsdocBlockComment(comment)).toBe(false);
    });

    it('should return false for a line comment', () => {
      const comment = { type: AST_TOKEN_TYPES.Line, value: '* looks like jsdoc' } as unknown;
      expect(isJsdocBlockComment(comment)).toBe(false);
    });
  });

  // ── isParentOwnedTargetType ──────────────────────────────────────────────

  describe('isParentOwnedTargetType', () => {
    it('should return true for MethodDefinition', () => {
      expect(isParentOwnedTargetType(AST_NODE_TYPES.MethodDefinition)).toBe(true);
    });

    it('should return true for ExportDefaultDeclaration', () => {
      expect(isParentOwnedTargetType(AST_NODE_TYPES.ExportDefaultDeclaration)).toBe(true);
    });

    it('should return true for ExportNamedDeclaration', () => {
      expect(isParentOwnedTargetType(AST_NODE_TYPES.ExportNamedDeclaration)).toBe(true);
    });

    it('should return true for PropertyDefinition', () => {
      expect(isParentOwnedTargetType(AST_NODE_TYPES.PropertyDefinition)).toBe(true);
    });

    it('should return true for Property', () => {
      expect(isParentOwnedTargetType(AST_NODE_TYPES.Property)).toBe(true);
    });

    it('should return false for a type not in the owned set', () => {
      expect(isParentOwnedTargetType(AST_NODE_TYPES.Identifier)).toBe(false);
    });
  });

  // ── getJsdocComment ──────────────────────────────────────────────────────

  describe('getJsdocComment', () => {
    it('should return null when there are no comments before the node', () => {
      const node = {} as unknown;
      const sourceCode = { getCommentsBefore: () => [] } as unknown;
      expect(getJsdocComment(sourceCode, node)).toBeNull();
    });

    it('should return null when comments exist but none are JSDoc block comments', () => {
      const node = {} as unknown;
      const sourceCode = {
        getCommentsBefore: () => [
          { type: AST_TOKEN_TYPES.Line, value: '* not jsdoc' },
          { type: AST_TOKEN_TYPES.Block, value: ' plain block' },
        ],
      } as unknown;
      expect(getJsdocComment(sourceCode, node)).toBeNull();
    });

    it('should return the JSDoc comment when one is present', () => {
      const jsdoc = { type: AST_TOKEN_TYPES.Block, value: '* description' };
      const node = {} as unknown;
      const sourceCode = { getCommentsBefore: () => [jsdoc] } as unknown;
      expect(getJsdocComment(sourceCode, node)).toBe(jsdoc);
    });

    it('should return the last JSDoc comment when multiple are present', () => {
      const first = { type: AST_TOKEN_TYPES.Block, value: '* first' };
      const last = { type: AST_TOKEN_TYPES.Block, value: '* last' };
      const node = {} as unknown;
      const sourceCode = { getCommentsBefore: () => [first, last] } as unknown;
      expect(getJsdocComment(sourceCode, node)).toBe(last);
    });
  });

  // ── getLineIndentation ───────────────────────────────────────────────────

  describe('getLineIndentation', () => {
    it('should return the leading whitespace of the node line', () => {
      const node = { loc: { start: { line: 1 } } } as unknown;
      const sourceCode = { lines: ['  const x = 1;'] } as unknown;
      expect(getLineIndentation(sourceCode, node)).toBe('  ');
    });

    it('should return empty string when the line has no indentation', () => {
      const node = { loc: { start: { line: 1 } } } as unknown;
      const sourceCode = { lines: ['const x = 1;'] } as unknown;
      expect(getLineIndentation(sourceCode, node)).toBe('');
    });

    it('should return empty string when the line index is out of range', () => {
      const node = { loc: { start: { line: 0 } } } as unknown;
      const sourceCode = { lines: [] } as unknown;
      expect(getLineIndentation(sourceCode, node)).toBe('');
    });
  });

  // ── getParentOwnedTargetNode ─────────────────────────────────────────────

  describe('getParentOwnedTargetNode', () => {
    it('should return the parent when its type is in the owned set', () => {
      const parent = { type: AST_NODE_TYPES.MethodDefinition };
      const node = { parent } as unknown;
      expect(getParentOwnedTargetNode(node)).toBe(parent);
    });

    it('should return null when the parent type is not in the owned set', () => {
      const node = { parent: { type: AST_NODE_TYPES.Program } } as unknown;
      expect(getParentOwnedTargetNode(node)).toBeNull();
    });
  });

  // ── getTargetNode ────────────────────────────────────────────────────────

  describe('getTargetNode', () => {
    it('should return the parent when its type is owned (MethodDefinition)', () => {
      const parent = { type: AST_NODE_TYPES.MethodDefinition };
      const node = { parent } as unknown;
      expect(getTargetNode(node)).toBe(parent);
    });

    it('should return the variable declaration when parent is a VariableDeclarator', () => {
      const declaration = {
        declarations: [{}],
        parent: { type: AST_NODE_TYPES.Program },
      };
      const declarator = {
        type: AST_NODE_TYPES.VariableDeclarator,
        parent: declaration,
      };
      const node = { parent: declarator } as unknown;
      expect(getTargetNode(node)).toBe(declaration);
    });

    it('should return the node itself when no parent or variable ownership applies', () => {
      const node = { parent: { type: AST_NODE_TYPES.Program } } as unknown;
      expect(getTargetNode(node)).toBe(node);
    });
  });

  // ── getVariableOwnedTargetNode ───────────────────────────────────────────

  describe('getVariableOwnedTargetNode', () => {
    it('should return null when parent is not a VariableDeclarator', () => {
      const node = { parent: { type: AST_NODE_TYPES.Program } } as unknown;
      expect(getVariableOwnedTargetNode(node)).toBeNull();
    });

    it('should return the declarator itself when there are multiple declarations', () => {
      const declarator = {
        type: AST_NODE_TYPES.VariableDeclarator,
        parent: {
          declarations: [{}, {}],
          parent: { type: AST_NODE_TYPES.Program },
        },
      };
      const node = { parent: declarator } as unknown;
      expect(getVariableOwnedTargetNode(node)).toBe(declarator);
    });

    it('should return the variable declaration for a single declaration without export', () => {
      const declaration = {
        declarations: [{}],
        parent: { type: AST_NODE_TYPES.Program },
      };
      const declarator = {
        type: AST_NODE_TYPES.VariableDeclarator,
        parent: declaration,
      };
      const node = { parent: declarator } as unknown;
      expect(getVariableOwnedTargetNode(node)).toBe(declaration);
    });

    it('should return the export declaration for a single exported declaration', () => {
      const exportDecl = { type: AST_NODE_TYPES.ExportNamedDeclaration };
      const declaration = {
        declarations: [{}],
        parent: exportDecl,
      };
      const declarator = {
        type: AST_NODE_TYPES.VariableDeclarator,
        parent: declaration,
      };
      const node = { parent: declarator } as unknown;
      expect(getVariableOwnedTargetNode(node)).toBe(exportDecl);
    });
  });

  // ── isStandaloneLineTarget ───────────────────────────────────────────────

  describe('isStandaloneLineTarget', () => {
    it('should return true when the node starts at column 0 on its own line', () => {
      const node = { loc: { start: { line: 1, column: 0 } } } as unknown;
      const sourceCode = { lines: ['function foo() {}'] } as unknown;
      expect(isStandaloneLineTarget(sourceCode, node)).toBe(true);
    });

    it('should return true when the node is indented but nothing else precedes it', () => {
      const node = { loc: { start: { line: 1, column: INDENTED_COLUMN } } } as unknown;
      const sourceCode = { lines: ['  function foo() {}'] } as unknown;
      expect(isStandaloneLineTarget(sourceCode, node)).toBe(true);
    });

    it('should return false when non-whitespace code precedes the node on the same line', () => {
      const node = { loc: { start: { line: 1, column: EXPORT_PREFIX_COLUMN } } } as unknown;
      const sourceCode = { lines: ['export function foo() {}'] } as unknown;
      expect(isStandaloneLineTarget(sourceCode, node)).toBe(false);
    });

    it('should return true when the line index is out of range', () => {
      const node = { loc: { start: { line: 0, column: 0 } } } as unknown;
      const sourceCode = { lines: [] } as unknown;
      expect(isStandaloneLineTarget(sourceCode, node)).toBe(true);
    });
  });
});
