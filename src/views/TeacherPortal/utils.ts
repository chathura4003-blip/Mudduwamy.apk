/**
 * Helper to match and resolve option indices for multiple choice questions
 */
export const getExactSingleOptionIndex = (targetVal: any, optionsList?: string[]): number => {
  if (targetVal === undefined || targetVal === null) return -1;
  if (typeof targetVal === 'number' && !isNaN(targetVal)) {
    return targetVal;
  }
  const tStr = String(targetVal).trim();
  if (tStr === '') return -1;
  const lower = tStr.toLowerCase();

  // Direct text match against options list
  if (optionsList && optionsList.length > 0) {
    const textMatch = optionsList.findIndex((opt) => opt && opt.trim().toLowerCase() === lower);
    if (textMatch !== -1) return textMatch;
  }

  // Single letter check (a=0, b=1, c=2, d=3, e=4, f=5, etc.)
  const letterMatch = lower.match(/(?:opt|option|vikalpaya|විකල්පය|පිළිතුර|op)?\s*([a-z])\b/);
  if (letterMatch) {
    const code = letterMatch[1].charCodeAt(0) - 97;
    if (code >= 0 && code < 26) return code;
  }

  // Numeric check: 0-indexed or 1-indexed
  const num = Number(lower);
  if (!isNaN(num)) {
    const numOpts = optionsList && optionsList.length > 0 ? optionsList.length : 10;
    if (num >= 0 && num < numOpts) return num;
    if (num >= 1 && num <= numOpts) return num - 1;
  }

  return -1;
};

export const checkOptionMatch = (oIdx: number, targetVal: any, optionsList?: string[]): boolean => {
  const selectedIdx = getExactSingleOptionIndex(targetVal, optionsList);
  return selectedIdx === oIdx;
};
