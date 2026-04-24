const KEYWORD_RULES = [
  { pattern: /\b(yes|interested|tell me more|sounds good|more info|i'm in|let's talk|what's the offer)\b/i, label: 'INTERESTED' },
  { pattern: /\b(no|stop|remove|unsubscribe|opt.?out|not interested|leave me alone|don't contact)\b/i, label: 'NOT_INTERESTED' },
  { pattern: /\b(call me|give me a call|phone me|can you call|please call|reach me)\b/i, label: 'CALL_ME' },
  { pattern: /\b(wrong number|wrong person|not .{0,20}owner|different person|no longer)\b/i, label: 'WRONG_NUMBER' },
];

function keywordClassify(text) {
  for (const { pattern, label } of KEYWORD_RULES) {
    if (pattern.test(text)) return label;
  }
  return 'UNKNOWN';
}

async function classify(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { label: keywordClassify(text), method: 'keyword' };

  try {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Classify this SMS/email reply from a property owner into exactly one label:
INTERESTED - they want more info or are open to talking
NOT_INTERESTED - they explicitly don't want to be contacted
CALL_ME - they specifically ask for a phone call
WRONG_NUMBER - the message isn't for the intended recipient
UNKNOWN - none of the above apply
Reply with ONLY the label, nothing else.`,
        },
        { role: 'user', content: text },
      ],
      max_tokens: 10,
      temperature: 0,
    });

    const label = completion.choices[0].message.content.trim().toUpperCase();
    const validLabels = ['INTERESTED', 'NOT_INTERESTED', 'CALL_ME', 'WRONG_NUMBER', 'UNKNOWN'];
    return { label: validLabels.includes(label) ? label : 'UNKNOWN', method: 'ai' };
  } catch (err) {
    console.error('Classifier error:', err.message);
    return { label: keywordClassify(text), method: 'keyword' };
  }
}

module.exports = { classify };
