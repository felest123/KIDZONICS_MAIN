import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Only the app's own phonics targets may be assessed (keeps this endpoint narrow).
const TARGETS = {
  A: ['a', 'ay', 'ah', 'hey', 'apple'],
  E: ['e', 'ee', 'eh', 'egg'],
  I: ['i', 'eye', 'ih', 'igloo'],
  O: ['o', 'oh', 'aw', 'octopus'],
  U: ['u', 'you', 'uh', 'umbrella'],
  CAT: ['cat'],
  BAT: ['bat'],
  HEN: ['hen'],
  PIN: ['pin'],
  DOG: ['dog'],
  SUN: ['sun'],
};

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const grid = Array.from({ length: rows }, (_, i) => [i, ...Array(cols - 1).fill(0)]);
  for (let j = 0; j < cols; j++) grid[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      grid[i][j] = Math.min(grid[i - 1][j] + 1, grid[i][j - 1] + 1, grid[i - 1][j - 1] + cost);
    }
  }
  return grid[rows - 1][cols - 1];
}

function similarity(a, b) {
  const longer = Math.max(a.length, b.length);
  if (!longer) return 0;
  return 1 - levenshtein(a, b) / longer;
}

function feedbackFor(score) {
  if (score >= 85) return 'Perfect! You said it clearly.';
  if (score >= 65) return 'Nice work! Say it one more time, a little slower.';
  if (score > 0) return 'Good try! Listen again, then say it slowly with us.';
  return 'We could not hear you clearly. Try again a little louder.';
}

// Settings and health live in SystemConfig (key "ai_agent"), managed from the
// separate Admin application. The health fields record real calls only, so the
// Admin app never shows "Connected" unless an assessment actually worked.
async function agentConfig(base44) {
  const page = await base44.asServiceRole.entities.SystemConfig.filter({ key: 'ai_agent' }, { limit: 1 });
  return page?.items?.[0] || null;
}

async function recordHealth(base44, cfg, ok, message = '') {
  if (!cfg) return;
  const at = new Date().toISOString();
  const patch = ok ? { last_ok_at: at } : { last_error_at: at, last_error: String(message).slice(0, 300) };
  await base44.asServiceRole.entities.SystemConfig.update(cfg.id, patch).catch(() => {});
}

export default async function (req) {
  let base44 = null;
  let cfg = null;
  try {
    base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    cfg = await agentConfig(base44).catch(() => null);
    if (cfg && cfg.assessment_enabled === false) {
      // Turned off by an administrator: say so, never invent a score.
      return Response.json(
        { error: 'The voice check is turned off right now.', unavailable: true },
        { status: 503 }
      );
    }
    const passMark = Number.isFinite(cfg?.pass_threshold) ? cfg.pass_threshold : 65;

    const audioUrl = typeof body?.audio_url === 'string' ? body.audio_url : '';
    const target = String(body?.target || '').trim().toUpperCase();

    if (!/^https?:\/\//i.test(audioUrl)) {
      return Response.json({ error: 'audio_url is required' }, { status: 400 });
    }
    if (!TARGETS[target]) {
      return Response.json({ error: 'Unsupported target' }, { status: 400 });
    }

    let transcriptRaw;
    try {
      transcriptRaw = await base44.asServiceRole.integrations.Core.TranscribeAudio({ audio_url: audioUrl });
    } catch (error) {
      await recordHealth(base44, cfg, false, error?.message || 'TranscribeAudio failed');
      throw error;
    }
    await recordHealth(base44, cfg, true);
    const transcript = String(transcriptRaw || '').trim();
    const spoken = normalize(transcript);

    let best = 0;
    for (const alias of TARGETS[target]) {
      if (!spoken) break;
      if (spoken === alias || spoken.split(' ').includes(alias)) {
        best = 1;
        break;
      }
      best = Math.max(best, similarity(spoken, alias));
    }

    const accuracy = Math.round(best * 100);
    return Response.json({
      accuracy,
      transcript,
      passed: accuracy >= passMark,
      feedback: feedbackFor(accuracy),
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Assessment failed' }, { status: 500 });
  }
}
