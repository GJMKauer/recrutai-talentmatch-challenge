module.exports = {
  create: (context) => {
    const compoundPropertyRegex = "(\\b(?:\\w+\\s+){0,2}(?:solid|dotted|dashed|double|groove|ridge|inset|outset)\\s+)?";
    const hexColorRegex = "#\\b([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\\b";
    const combinedRegex = new RegExp(compoundPropertyRegex + hexColorRegex);

    return {
      Literal(node) {
        if (typeof node.value === "string") {
          const isWithinCyGet =
            node.parent.type === "CallExpression" &&
            node.parent.callee.object &&
            node.parent.callee.object.name === "cy" &&
            node.parent.callee.property.name === "get";
          if (!isWithinCyGet && combinedRegex.test(node.value)) {
            context.report({
              message: "Use RGB or RGBA color values instead of hexadecimal colors.",
              node,
            });
          }
        }
      },
    };
  },
  meta: {
    docs: { description: "Disallow the use of hexadecimal color values and auto-fix to RGB or RGBA color values." },
    fixable: "code",
    type: "suggestion",
  },
};
