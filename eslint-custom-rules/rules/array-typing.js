module.exports = {
  create(context) {
    return {
      TSArrayType(node) {
        context.report({
          fix(fixer) {
            const sourceCode = context.getSourceCode();
            const elementType = sourceCode.getText(node.elementType);
            return fixer.replaceText(node, `Array<${elementType}>`);
          },
          message: "Use Array<Type> instead of Type[]",
          node,
        });
      },
    };
  },
  meta: {
    docs: { description: "enforce using Array<Type> instead of Type[]" },
    fixable: "code",
    schema: [],
    type: "suggestion",
  },
};
