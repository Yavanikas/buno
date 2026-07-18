import type { BudgetState } from '../../../lib/calc';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

const SYSTEM_PROMPT =
  'You are a calm budgeting assistant. You must NEVER state an exact remaining balance or exact rupee amount. Only describe spending pace using relative, qualitative language such as comfort zones, pacing, or flexibility. Adapt tone to riskLabel: safe = reassuring, watchful = gently cautious, fragile = clear but non-alarming. Keep the response to one short sentence.';

const FALLBACK_ADVICE = 'Keep an eye on your pace today.';
const OPENAI_TIMEOUT_MS = 10_000;

type RiskLabel = BudgetState['riskLabel'];

type AdviceRequestBody = {
  riskLabel?: RiskLabel;
  zoneLabel?: BudgetState['zoneLabel'];
  paceLabel?: BudgetState['paceLabel'];
};

type SafeAdviceContext = {
  riskLabel: RiskLabel;
  zoneLabel: BudgetState['zoneLabel'];
  paceLabel: BudgetState['paceLabel'];
};

type OpenAIResponse = {
  output_text?: string;
};

export async function POST(request: Request) {
  const parsedBody = await parseRequestBody(request);

  if (!parsedBody) {
    logDevelopmentError('Invalid advice request body');
    return fallbackResponse();
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    logDevelopmentError('Missing OPENAI_API_KEY');
    return fallbackResponse();
  }

  const safeContext = toSafeAdviceContext(parsedBody);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
                text: JSON.stringify(safeContext),
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logDevelopmentError('OpenAI API error', {
        status: response.status,
        body: errorBody,
      });

      return fallbackResponse();
    }

    const data = (await response.json()) as OpenAIResponse;
    const advice = data.output_text?.trim();

    if (!advice) {
      logDevelopmentError('OpenAI API returned empty advice');
      return fallbackResponse();
    }

    if (containsExactAmount(advice)) {
      logDevelopmentError('OpenAI API returned advice with exact numeric content');
      return fallbackResponse();
    }

    return Response.json({ advice });
  } catch (error) {
    logDevelopmentError('OpenAI advice request failed', error);
    return fallbackResponse();
  } finally {
    clearTimeout(timeout);
  }
}

async function parseRequestBody(request: Request): Promise<AdviceRequestBody | null> {
  try {
    const body = (await request.json()) as unknown;

    if (!isRecord(body)) {
      return null;
    }

    return body;
  } catch (error) {
    logDevelopmentError('Failed to parse advice request JSON', error);
    return null;
  }
}

function toSafeAdviceContext(body: AdviceRequestBody): SafeAdviceContext {
  return {
    riskLabel: isRiskLabel(body.riskLabel) ? body.riskLabel : 'watchful',
    zoneLabel: isZoneLabel(body.zoneLabel) ? body.zoneLabel : 'Watchful zone',
    paceLabel: isPaceLabel(body.paceLabel) ? body.paceLabel : 'Pace is tightening',
  };
}

function isRecord(value: unknown): value is AdviceRequestBody {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRiskLabel(value: unknown): value is RiskLabel {
  return value === 'safe' || value === 'watchful' || value === 'fragile';
}

function isZoneLabel(value: unknown): value is BudgetState['zoneLabel'] {
  return value === 'Comfortable zone' || value === 'Watchful zone' || value === 'Fragile zone';
}

function isPaceLabel(value: unknown): value is BudgetState['paceLabel'] {
  return (
    value === 'Flexible today' ||
    value === 'Pace is tightening' ||
    value === 'Very limited flexibility'
  );
}

function containsExactAmount(value: string): boolean {
  return /₹|\brs\.?\b|\brupees?\b|\d/.test(value.toLowerCase());
}

function fallbackResponse(): Response {
  return Response.json({ advice: FALLBACK_ADVICE });
}

function logDevelopmentError(message: string, error?: unknown) {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  if (error === undefined) {
    console.error(message);
    return;
  }

  console.error(message, error);
}
