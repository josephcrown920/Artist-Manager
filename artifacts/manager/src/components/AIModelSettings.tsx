import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

type Provider = {
  id: string; label: string; configured: boolean; defaultModel: string; models: string[];
};
type Configuration = { provider: string; model: string; providers: Provider[] };

async function readResponse<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "AI settings request failed.");
  return body;
}

export default function AIModelSettings() {
  const client = useQueryClient();
  const query = useQuery<Configuration>({
    queryKey: ["ai-settings"],
    queryFn: async () => readResponse<Configuration>(await fetch("/api/ai-settings")),
  });
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  useEffect(() => {
    if (query.data) { setProvider(query.data.provider); setModel(query.data.model); }
  }, [query.data]);
  const save = useMutation({
    mutationFn: async () => readResponse(await fetch("/api/ai-settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, model }),
    })),
    onSuccess: () => client.invalidateQueries({ queryKey: ["ai-settings"] }),
  });
  const selected = query.data?.providers.find(p => p.id === provider);
  const fieldClass = "w-full rounded-lg px-3 py-2 text-sm bg-neutral-900 border border-neutral-700 text-white";
  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 space-y-4" aria-labelledby="ai-model-title">
      <div>
        <h2 id="ai-model-title" className="text-sm font-semibold text-white">AI team models</h2>
        <p className="text-xs text-neutral-400 mt-1">Choose the model your Manager, Assistant, PR, Social, Playlister and Advertiser use for their next responses.</p>
      </div>
      {query.isLoading && <p className="text-sm text-neutral-400">Loading models…</p>}
      {query.isError && <p role="alert" className="text-sm text-red-400">{query.error.message}</p>}
      {query.data && <>
        <label className="block text-xs text-neutral-300">Provider
          <select className={`${fieldClass} mt-1`} value={provider} onChange={event => {
            const next = query.data.providers.find(p => p.id === event.target.value);
            setProvider(event.target.value); setModel(next?.defaultModel || ""); save.reset();
          }}>
            {query.data.providers.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
        <label className="block text-xs text-neutral-300">Model
          {selected?.models.length ? <select className={`${fieldClass} mt-1`} value={model} onChange={event => { setModel(event.target.value); save.reset(); }}>
            {selected.models.map(name => <option key={name} value={name}>{name}</option>)}
          </select> : <input className={`${fieldClass} mt-1`} value={model} onChange={event => { setModel(event.target.value); save.reset(); }} placeholder="Provider model ID" />}
        </label>
        {selected && !selected.configured && <p className="text-xs text-amber-300" role="status">Add your {selected.label} API key in the server’s secure environment settings before using this model.</p>}
        {provider === "ollama" && <p className="text-xs text-neutral-400">Uses your Ollama Cloud account and its available credits. Account limits and model availability apply. If a request fails, it will not switch to another provider.</p>}
        <div className="flex items-center gap-3">
          <button type="button" disabled={!model.trim() || save.isPending} onClick={() => save.mutate()} className="rounded-lg bg-fuchsia-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {save.isPending && <Loader2 className="inline mr-2 animate-spin" size={14} />}Save AI model
          </button>
          {save.isSuccess && <span role="status" className="text-xs text-green-400">Saved for future AI requests.</span>}
        </div>
        {save.isError && <p role="alert" className="text-sm text-red-400">{save.error.message}</p>}
        <p className="text-xs text-neutral-400">This selects the agents’ language model. It does not enable autonomous posting, advertising or account control.</p>
      </>}
    </section>
  );
}
