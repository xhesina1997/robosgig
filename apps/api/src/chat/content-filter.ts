export interface FilterResult {
  content: string;
  wasFiltered: boolean;
}

function countDigits(s: string): number {
  return (s.match(/\d/g) ?? []).length;
}

export function filterMessage(raw: string): FilterResult {
  let content = raw;
  let wasFiltered = false;

  const redact = (label: string) => {
    wasFiltered = true;
    return `[${label} removed]`;
  };

  // Phone numbers: sequences starting/ending with a digit, with separators, 7+ actual digits
  content = content.replace(/(\+?[\d][\d\s.\-()]{5,18}[\d])/g, (match) => {
    if (countDigits(match) >= 7) return redact('contact info');
    return match;
  });

  // Email addresses
  content = content.replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, () =>
    redact('contact info'),
  );

  // Off-platform payment services
  content = content.replace(
    /\b(paypal|venmo|cash\s*app|cashapp|revolut|wise|transferwise|western\s*union|zelle|skrill|stripe)\b/gi,
    () => redact('payment info'),
  );

  // Messaging / social platforms used to move conversations off-platform
  content = content.replace(
    /\b(whatsapp|wapp|telegram|tg\b|signal|viber|instagram|facebook|fb\b|snapchat|tiktok)\b/gi,
    () => redact('contact info'),
  );

  // Explicit contact-sharing phrases
  content = content.replace(
    /\b(my\s+(?:phone|number|mobile|cell)\s+(?:is|:)|call\s+me\s+(?:at|on)|text\s+me\s+(?:at|on)|reach\s+me\s+(?:at|on)|contact\s+me\s+(?:at|on|via)|dm\s+me|message\s+me\s+on|find\s+me\s+on|add\s+me\s+on)\b/gi,
    () => redact('contact info'),
  );

  // Off-platform payment language
  content = content.replace(
    /\b(pay\s+(?:you|me)\s+(?:directly|outside|in\s+cash|in\s+person)|skip\s+(?:the\s+)?(?:platform|payment|fee)|pay\s+off[-\s]platform|direct\s+(?:bank\s+)?(?:transfer|payment)|bank\s+transfer|cash\s+in\s+hand)\b/gi,
    () => redact('payment info'),
  );

  return { content, wasFiltered };
}
