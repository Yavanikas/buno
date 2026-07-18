const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

const SYSTEM_PROMPT =
  'You are a calm budgeting assistant. You must NEVER state an exact remaining balance or exact rupee amount. Only describe spending pace using relative, qualitative language such as comfort zones, pacing, or flexibility. Adapt tone to riskLabel: safe = reassuring, watchful = gently cautious, fragile = clear but non-alarming. Keep the response to one short sentence.';

const FALLBACK_ADVICE = 'Keep an eye on your pace today.';
const OPENAI_TIMEOUT_MS = 10_000;

type AdviceRequestBody = {
  riskLabel?: 'safe' | 'watchful' | 'fragile';
  safetyRangeLow?: number;
  safetyRangeHigh?: number;
  recentAverage?: number;
};

type OpenAIResponse = {
  output_text?: string;
};

export async function POST(request: Request) {
  let body: AdviceRequestBody;

  try {
    const parsedBody = (await request.json()) as unknown;
    body = parsedBody && typeof parsedBody === 'object' ? (parsedBody as AdviceRequestBody) : {};
  } catch {
    return Response.json({ advice: FALLBACK_ADVICE }, { status: 400 });
  }

  const safeContext = {
    riskLabel: isRiskLabel(body.riskLabel) ? body.riskLabel : 'watchful',
    safetyRangeLow: toSafeNumber(body.safetyRangeLow),
    safetyRangeHigh: toSafeNumber(body.safetyRangeHigh),
    recentAverage: toSafeNumber(body.recentAverage),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'gpt-5.6',
        instructions: SYSTEM_PROMPT,
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: JSON.stringify({
                  riskLabel: safeContext.riskLabel,
                  safetyRangeLow: safeContext.safetyRangeLow,
                  safetyRangeHigh: safeContext.safetyRangeHigh,
                  recentAverage: safeContext.recentAverage,
                }),
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();

      if (process.env.NODE_ENV === 'development') {
        console.error('OpenAI API error', {
          status: response.status,
          body: errorBody,
        });
      }

      return Response.json({ advice: FALLBACK_ADVICE }, { status: 502 });
    }

    const data = (await response.json()) as OpenAIResponse;

    return Response.json({
      advice: data.output_text?.trim() || FALLBACK_ADVICE,
    });
  } catch {
    return Response.json({ advice: FALLBACK_ADVICE }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}

function isRiskLabel(value: unknown): value is NonNullable<AdviceRequestBody['riskLabel']> {
  return value === 'safe' || value === 'watchful' || value === 'fragile';
}

function toSafeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}
