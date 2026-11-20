import type { HypeFlag } from "../types.js";

export const HYPE_DICTIONARY_VERSION = "hype-dict-v1";

interface HypeRule {
  rule_id: string;
  category: HypeFlag["category"];
  pattern: RegExp;
}

const HYPE_RULES: HypeRule[] = [
  {
    rule_id: "certainty_guarantee_v1",
    category: "CERTAINTY",
    pattern: /\b(guaranteed|100%\s*(?:return|profit|sure|accuracy|safe)|pakka|sure\s*shot|risk[-\s]*free)\b/gi,
  },
  {
    rule_id: "urgency_last_chance_v1",
    category: "URGENCY",
    pattern: /\b(last\s*chance|don['’]?t\s*miss(?:\s*out)?|hurry(?:\s*up)?|limited\s*(?:seats|time|slots)|abhi\s*(?:le\s*lo|kharid\s*lo)|act\s*fast|jaldi\s*karo)\b/gi,
  },
  {
    rule_id: "return_promise_multiplier_v1",
    category: "RETURN_PROMISE",
    pattern: /\b(\d+x\s*(?:multibagger|return|profit)?|multibagger|double\s*(?:money|paisa|capital)|paisa\s*double|jackpot\s*(?:call|trade|stock)?|rocket\s*banega|skyrocket)\b/gi,
  },
  {
    rule_id: "promotional_funnel_v1",
    category: "PROMOTIONAL",
    pattern: /\b(join\s*(?:my|our)?\s*(?:telegram|vip|premium|channel)|vip\s*premium|paid\s*group|account\s*handl(?:ing|e)|dm\s*(?:for|to)\s*(?:join|paid|vip)|link\s*in\s*bio)\b/gi,
  },
];

export function detectHypePhrases(sourceText: string): {
  flags: HypeFlag[];
  dictionary_version: string;
} {
  if (!sourceText || !sourceText.trim()) {
    return { flags: [], dictionary_version: HYPE_DICTIONARY_VERSION };
  }

  const flags: HypeFlag[] = [];
  const seenSpans = new Set<string>();

  for (const rule of HYPE_RULES) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null = regex.exec(sourceText);
    while (match !== null) {
      const start = match.index;
      const phrase = match[0];
      const end = start + phrase.length;
      const spanKey = `${start}:${end}`;
      if (!seenSpans.has(spanKey)) {
        seenSpans.add(spanKey);
        flags.push({
          phrase,
          start,
          end,
          rule_id: rule.rule_id,
          category: rule.category,
        });
      }
      match = regex.exec(sourceText);
    }
  }

  flags.sort((a, b) => a.start - b.start || a.end - b.end);
  return { flags, dictionary_version: HYPE_DICTIONARY_VERSION };
}
