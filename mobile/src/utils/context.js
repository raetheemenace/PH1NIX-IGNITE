// Context awareness for ambiguous Tagalog words
export const AMBIGUOUS_SIGNS = {
  BASA: [
    { meaning: 'read', context: ['LIBRO', 'AKLAT'], probability: 0.6 },
    { meaning: 'wet', context: ['ULAN', 'TUBIG'], probability: 0.4 }
  ],
  BUKAS: [
    { meaning: 'tomorrow', context: ['PUPUNTA', 'GAGAWIN'], probability: 0.5 },
    { meaning: 'open', context: ['PINTO', 'BINTANA'], probability: 0.5 }
  ],
  SUKA: [
    { meaning: 'vinegar', context: ['LUTO', 'PAGKAIN'], probability: 0.7 },
    { meaning: 'vomit', context: ['SAKIT', 'MASAMA'], probability: 0.3 }
  ]
};

export const resolveAmbiguity = (sign, recentSigns, facialExpression) => {
  const ambiguous = AMBIGUOUS_SIGNS[sign];
  if (!ambiguous) return sign;

  // Check surrounding signs
  for (const option of ambiguous) {
    if (recentSigns.some(s => option.context.includes(s))) {
      return option.meaning;
    }
  }

  // Fall back to most probable
  return ambiguous.sort((a, b) => b.probability - a.probability)[0].meaning;
};
