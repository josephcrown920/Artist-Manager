import test from "node:test";
import assert from "node:assert/strict";
import { callOllama } from "../src/lib/ollama.js";
import { OLLAMA_MODELS } from "../src/lib/ai-config.js";

test("Ollama Cloud provider contract", async t => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OLLAMA_API_KEY;
  t.after(() => {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OLLAMA_API_KEY;
    else process.env.OLLAMA_API_KEY = originalKey;
  });
  process.env.OLLAMA_API_KEY = "unit-test-placeholder";

  await t.test("all seven models use direct cloud IDs and preserve conversation roles", async () => {
    const calls: Array<{ url: unknown; init: RequestInit | undefined }> = [];
    globalThis.fetch = async (url, init) => {
      calls.push({ url, init });
      return Response.json({ message: { content: "A release plan" } });
    };
    for (const model of OLLAMA_MODELS) {
      assert.equal(await callOllama(model, [
        { role: "system", content: "ignored duplicate" },
        { role: "user", content: "Plan my release" },
        { role: "assistant", content: "When is it?" },
      ], "You are the artist manager", { maxTokens: 2048, temperature: 0.2 }), "A release plan");
      const call = calls.at(-1)!;
      assert.equal(call.url, "https://ollama.com/api/chat");
      assert.equal(call.init?.method, "POST");
      assert.equal(new Headers(call.init?.headers).get("Authorization"), "Bearer unit-test-placeholder");
      const body = JSON.parse(String(call.init?.body));
      assert.equal(body.model, model);
      assert.equal(body.stream, false);
      assert.deepEqual(body.options, { num_predict: 2048, temperature: 0.2 });
      assert.deepEqual(body.messages.map((m: {role: string}) => m.role), ["system", "user", "assistant"]);
      assert.equal(body.messages[0].content, "You are the artist manager");
    }
    assert.equal(calls.length, 7);
  });

  await t.test("missing credentials and invalid models do not make network calls", async () => {
    globalThis.fetch = async () => { throw new Error("unexpected network request"); };
    delete process.env.OLLAMA_API_KEY;
    await assert.rejects(callOllama("beam", [], ""), /OLLAMA_API_KEY/);
    process.env.OLLAMA_API_KEY = "unit-test-placeholder";
    await assert.rejects(callOllama("not-a-model", [], ""), /supported/);
  });

  await t.test("auth errors and exhausted credits are actionable without leaking response bodies", async () => {
    for (const [status, pattern] of [[401, /authentication/], [403, /authentication/], [429, /usage limit/], [404, /availability/]] as const) {
      globalThis.fetch = async () => new Response("private-upstream-details", { status });
      await assert.rejects(callOllama("beam", [], ""), error => {
        assert.match((error as Error).message, pattern);
        assert.doesNotMatch((error as Error).message, /private-upstream-details/);
        return true;
      });
    }
  });

  await t.test("empty, thinking-only, and error responses fail instead of claiming success", async () => {
    for (const body of [{}, { message: { content: "  ", thinking: "thinking" } }, { error: "unavailable" }, { message: { content: 42 } }]) {
      globalThis.fetch = async () => Response.json(body);
      await assert.rejects(callOllama("beam", [], ""), /no answer/);
    }
  });
});
