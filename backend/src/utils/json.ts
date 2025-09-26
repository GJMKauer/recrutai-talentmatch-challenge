export const extractJson = (text: string) => {
  let t = text
    .trim()
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");

  if (start !== -1 && end !== -1 && end > start) t = t.slice(start, end + 1);

  return t;
};
