module.exports = {
  create(context) {
    const filename = context.getFilename();

    // Ignora as tipagens na pasta "types/ObjectOf.ts" pois é a pasta original da tipagem.
    if (filename.includes("/types/ObjectOf.ts")) {
      return {};
    }

    const isIndexSignature = (member) => {
      return member.type === "TSIndexSignature" && member.typeAnnotation;
    };

    const checkTypeLiteral = (node) => {
      if (node.members.length === 1 && isIndexSignature(node.members[0])) {
        const valueType = node.members[0].typeAnnotation.typeAnnotation;
        context.report({
          fix(fixer) {
            const sourceCode = context.getSourceCode();
            const valueTypeText = sourceCode.getText(valueType);
            const fixes = [fixer.replaceText(node, `ObjectOf<${valueTypeText}>`)];

            return fixes;
          },
          message: "Use ObjectOf<T> type alias instead of { [key: Type]: ValueType }",
          node,
        });
      }
    };

    return {
      TSPropertySignature(node) {
        if (node.typeAnnotation && node.typeAnnotation.typeAnnotation.type === "TSTypeLiteral") {
          checkTypeLiteral(node.typeAnnotation.typeAnnotation);
        }
      },
      TSTypeAliasDeclaration(node) {
        if (node.typeAnnotation && node.typeAnnotation.type === "TSTypeLiteral") {
          checkTypeLiteral(node.typeAnnotation);
        }
      },
      TSTypeLiteral(node) {
        checkTypeLiteral(node);
      },
    };
  },
  meta: {
    docs: { description: "enforce using ObjectOf<T> type alias instead of direct object type" },
    fixable: "code",
    schema: [],
    type: "suggestion",
  },
};
