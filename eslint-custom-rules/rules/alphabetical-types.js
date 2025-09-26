module.exports = {
  create(context) {
    const checkUnionTypes = (node) => {
      if (node.type === "TSUnionType") {
        const types = node.types;
        const sortedTypes = types.slice().sort((a, b) => {
          const aText = context.getSourceCode().getText(a);
          const bText = context.getSourceCode().getText(b);
          return aText < bText ? -1 : 1;
        });

        if (
          JSON.stringify(types.map((t) => context.getSourceCode().getText(t))) !==
          JSON.stringify(sortedTypes.map((t) => context.getSourceCode().getText(t)))
        ) {
          context.report({
            fix(fixer) {
              const sortedText = sortedTypes.map((type) => context.getSourceCode().getText(type)).join(" | ");
              return fixer.replaceText(node, sortedText);
            },
            message: "Type union members should be in alphabetical order",
            node,
          });
        }
      }
    };

    return {
      TSPropertySignature(node) {
        if (node.typeAnnotation && node.typeAnnotation.typeAnnotation) {
          checkUnionTypes(node.typeAnnotation.typeAnnotation);
        }
      },
      TSTypeAliasDeclaration(node) {
        if (node.typeAnnotation) {
          checkUnionTypes(node.typeAnnotation);
        }
      },
    };
  },
  meta: {
    docs: { description: "enforce alphabetical order in type unions" },
    fixable: "code",
    schema: [],
    type: "suggestion",
  },
};
