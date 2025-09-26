module.exports = {
  create(context) {
    return {
      LogicalExpression(node) {
        if (node.operator === "&&" && node.parent.type === "JSXExpressionContainer") {
          context.report({
            message: "Use a ternary operator instead of '&&' in JSX",
            node,
          });
        }
      },
    };
  },
  meta: {
    docs: { description: "Enforce ternary operator usage instead of '&&' in JSX" },
    type: "suggestion",
  },
};
