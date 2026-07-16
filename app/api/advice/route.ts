const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

const SYSTEM_PROMPT =
  'You are a calm budgeting assistant. You must NEVER state an exact remaining balance or exact rupee amount. Only describe spending pace using relative, qualitative language such as comfort zones, pacing, or flexibility. Adapt tone to riskLabel: safe = reassuring, watchful = gently cautious, fragile = clear but non-alarming. Keep the response to one short sentence.';

const FALLBACK_ADVICE = 'Keep an eye on your pace today.';

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
    body = await request.json();
  } catch {
    return Response.json({ advice: FALLBACK_ADVICE }, { status: 400 });
  }

  const { riskLabel, safetyRangeLow, safetyRangeHigh, recentAverage } = body;

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
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
                  riskLabel,
                  safetyRangeLow,
                  safetyRangeHigh,
                  recentAverage,
                }),
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      return Response.json({ advice: FALLBACK_ADVICE }, { status: 502 });
    }

    const data = (await response.json()) as OpenAIResponse;

    return Response.json({
      advice: data.output_text?.trim() || FALLBACK_ADVICE,
    });
  } catch {
    return Response.json({ advice: FALLBACK_ADVICE }, { status: 502 });
  }
}
