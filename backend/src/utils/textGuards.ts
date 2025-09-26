const MAX_SAMPLE_SIZE = 4000;

/**
 * Verifica se o texto contém assinaturas suspeitas de conteúdo binário ou imagens.
 * @param value O conteúdo do currículo em formato de string.
 * @returns true se o conteúdo parecer inválido, false caso contrário.
 */
const hasSuspiciousSignature = (value: string): boolean => {
  const lowered = value.slice(0, 256).toLowerCase();
  return ["data:image", "jfif", "png", "gif89a", "riff", "webp", "<svg"].some((signature) =>
    lowered.includes(signature)
  );
};

/**
 * Conta os caracteres não textuais em uma amostra de texto.
 * Caracteres não textuais incluem caracteres de controle e caracteres inválidos.
 * @param sample A amostra de texto a ser analisada.
 * @returns O número de caracteres não textuais encontrados na amostra.
 */
const countNonTextCharacters = (sample: string): number => {
  let count = 0;
  for (let index = 0; index < sample.length; index += 1) {
    const code = sample.charCodeAt(index);
    if (
      code === 0x0 ||
      code === 0xfffd ||
      code < 0x09 ||
      (code > 0x0d && code < 0x20) // caracteres de controle
    ) {
      count += 1;
    }
  }

  return count;
};

/**
 * Verifica se o currículo em Markdown provavelmente é inválido.
 * Critérios para considerar um currículo inválido incluem:
 * - Texto vazio ou composto apenas por espaços em branco.
 * - Presença de assinaturas suspeitas de conteúdo binário ou imagens.
 * - Proporção muito baixa de caracteres alfabéticos (menos de 10%).
 * - Proporção muito alta de caracteres não textuais (mais de 8%).
 * - Texto muito curto (menos de 20 palavras).
 * @param markdown O conteúdo do currículo em formato Markdown.
 * @returns true se o currículo parecer inválido, false caso contrário.
 */
export function isLikelyInvalidResume(markdown: string): boolean {
  if (!markdown) {
    return true;
  }

  const trimmed = markdown.trim();
  if (!trimmed) {
    return true;
  }

  const sample = trimmed.slice(0, MAX_SAMPLE_SIZE);

  if (hasSuspiciousSignature(sample)) {
    return true;
  }

  const totalLength = sample.length;
  if (totalLength === 0) {
    return true;
  }

  const letterMatches = sample.match(/\p{L}/gu)?.length ?? 0;
  const letterRatio = letterMatches / totalLength;

  if (letterRatio < 0.1) {
    return true;
  }

  const nonTextRatio = countNonTextCharacters(sample) / totalLength;
  if (nonTextRatio > 0.08) {
    return true;
  }

  // textos muito curtos não trazem informações úteis de currículo
  if (trimmed.split(/\s+/).length < 20) {
    return true;
  }

  return false;
}
