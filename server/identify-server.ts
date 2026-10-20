// 앱이 보낸 물고기 사진을 Claude 비전 모델로 식별하는 작은 서버입니다.
// API 키를 앱에 넣지 않으려고 서버를 따로 둡니다.
// 실행: ANTHROPIC_API_KEY=... npm start  (기본 포트 8787)
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { SPECIES } from '../src/data/species.ts';

const PORT = Number(process.env.PORT ?? 8787);
const MAX_BODY_BYTES = 8 * 1024 * 1024;
const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

const client = new Anthropic();

const IdentifySchema = z.object({
  isFish: z.boolean(),
  candidates: z
    .array(
      z.object({
        speciesId: z.string().nullable(),
        name: z.string(),
        confidence: z.number(),
        reason: z.string(),
      }),
    )
    .max(3),
  note: z.string(),
});

const speciesList = SPECIES.map(
  (s) => `- ${s.id}: ${s.name} (${[...s.aliases, s.scientificName].join(', ')})`,
).join('\n');

const SYSTEM_PROMPT = `당신은 한국 연안과 내수면 어종을 감별하는 어류 전문가입니다.
사용자가 낚시로 잡은 생물 사진을 보내면 어떤 종인지 판별합니다.

아래는 앱이 지원하는 어종 목록입니다(id: 표준명 (별칭, 학명)).
${speciesList}

규칙:
- 가능성이 높은 순서로 후보를 최대 3개 고릅니다.
- 목록에 있는 종이면 speciesId에 그 id를 그대로 넣습니다.
- 목록에 없는 종이라고 판단하면 speciesId는 null로 두고 name에 한국 표준명을 적습니다.
- confidence는 0과 1 사이 값이며, 후보들의 합이 1을 넘지 않게 합니다.
- reason에는 판단 근거가 된 외형 특징(체형, 무늬, 지느러미, 입 모양 등)을 한 문장으로 적습니다.
- 사진에 물고기나 두족류가 없으면 isFish를 false로 하고 candidates는 비웁니다.
- 사진이 흐리거나 일부만 보여 확신하기 어려우면 note에 다시 찍을 때의 요령을 적습니다. 그 외에는 note를 빈 문자열로 둡니다.
- 모든 텍스트는 한국어로 씁니다.`;

const RequestSchema = z.object({
  imageBase64: z.string().min(1),
  mediaType: z.enum(MEDIA_TYPES),
});

async function identify(imageBase64: string, mediaType: (typeof MEDIA_TYPES)[number]) {
  const response = await client.beta.messages.parse({
    model: 'claude-opus-5-5',
    max_tokens: 4000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: betaZodOutputFormat(IdentifySchema) },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
          { type: 'text', text: '이 사진 속 생물을 판별해 주세요.' },
        ],
      },
    ],
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('모델이 이 요청을 처리하지 않았습니다.');
  }
  if (!response.parsed_output) {
    throw new Error(`응답을 해석하지 못했습니다 (stop_reason: ${response.stop_reason}).`);
  }

  // 모델이 목록에 없는 id를 지어낸 경우 목록 밖 종으로 취급합니다.
  const known = new Set(SPECIES.map((s) => s.id));
  return {
    ...response.parsed_output,
    candidates: response.parsed_output.candidates.map((c) => ({
      ...c,
      speciesId: c.speciesId && known.has(c.speciesId) ? c.speciesId : null,
      confidence: Math.min(1, Math.max(0, c.confidence)),
    })),
  };
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error('사진 용량이 너무 큽니다.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(body));
}

createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, null);
  if (req.method !== 'POST' || req.url !== '/identify') return send(res, 404, { error: 'Not found' });

  let parsed;
  try {
    parsed = RequestSchema.safeParse(JSON.parse(await readBody(req)));
  } catch (e) {
    return send(res, 400, { error: e instanceof Error ? e.message : '잘못된 요청입니다.' });
  }
  if (!parsed.success) return send(res, 400, { error: '잘못된 요청입니다.' });

  try {
    send(res, 200, await identify(parsed.data.imageBase64, parsed.data.mediaType));
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return send(res, 429, { error: '잠시 후 다시 시도해 주세요.' });
    if (e instanceof Anthropic.APIError) {
      console.error('Claude API error', e.status, e.message);
      return send(res, 502, { error: '식별 서버에 문제가 생겼습니다.' });
    }
    console.error(e);
    send(res, 500, { error: e instanceof Error ? e.message : '알 수 없는 오류입니다.' });
  }
}).listen(PORT, () => {
  console.log(`identify server listening on http://localhost:${PORT}/identify`);
});
