// Cloudflare Pages Function — API state aplikasi Warung Sayur Cemara
// Endpoint: GET /api/state  (ambil state)
//           PUT /api/state  (simpan state, body: { state, baseRevision })
// Database: Cloudflare D1, binding name "DB" (lihat functions/README.md)

const STATE_ID = 'warung_cemara_v3_state';
const MAX_BYTES = 900 * 1024;
const HISTORY_LIMIT = 50;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function onRequestGet({ env }) {
  try {
    if (!env.DB) {
      return json({ ok: false, error: 'Binding D1 "DB" belum dikonfigurasi di project Pages.' }, 500);
    }

    const row = await env.DB
      .prepare('SELECT data, revision, updated_at FROM app_state WHERE id = ?')
      .bind(STATE_ID)
      .first();

    if (!row) {
      return json({ ok: true, state: null, revision: 0, updatedAt: null });
    }

    return json({
      ok: true,
      state: JSON.parse(row.data),
      revision: row.revision,
      updatedAt: row.updated_at,
    });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message ? err.message : err) }, 500);
  }
}

export async function onRequestPut({ request, env }) {
  try {
    if (!env.DB) {
      return json({ ok: false, error: 'Binding D1 "DB" belum dikonfigurasi di project Pages.' }, 500);
    }

    const body = await request.json().catch(() => null);
    const state = body && body.state;
    if (!state || typeof state !== 'object' || Array.isArray(state)) {
      return json({ ok: false, error: 'Payload tidak valid: "state" harus berupa object.' }, 400);
    }

    const text = JSON.stringify(state);
    const bytes = new TextEncoder().encode(text).length;
    if (bytes > MAX_BYTES) {
      return json(
        { ok: false, error: `Data ${(bytes / 1024).toFixed(0)} KB melebihi batas ${(MAX_BYTES / 1024).toFixed(0)} KB.` },
        413
      );
    }

    const now = new Date().toISOString();

    const row = await env.DB
      .prepare(
        `INSERT INTO app_state (id, data, updated_at, revision)
         VALUES (?, ?, ?, 1)
         ON CONFLICT(id) DO UPDATE SET
           data = excluded.data,
           updated_at = excluded.updated_at,
           revision = app_state.revision + 1
         RETURNING revision, updated_at`
      )
      .bind(STATE_ID, text, now)
      .first();

    // Simpan riwayat (maksimal 50 versi terakhir) untuk audit / pemulihan.
    await env.DB
      .prepare('INSERT INTO state_history (state_id, data, created_at) VALUES (?, ?, ?)')
      .bind(STATE_ID, text, now)
      .run();

    await env.DB
      .prepare(
        `DELETE FROM state_history
         WHERE state_id = ?
           AND id NOT IN (
             SELECT id FROM state_history WHERE state_id = ? ORDER BY id DESC LIMIT ?
           )`
      )
      .bind(STATE_ID, STATE_ID, HISTORY_LIMIT)
      .run();

    return json({
      ok: true,
      revision: row ? row.revision : null,
      updatedAt: row ? row.updated_at : now,
    });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message ? err.message : err) }, 500);
  }
}
