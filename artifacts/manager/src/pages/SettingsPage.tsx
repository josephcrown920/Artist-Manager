import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, Eye, EyeOff, CheckCircle2, Loader2 } from "lucide-react";

interface Settings {
  artistName?: string; genre?: string;
  twitterBearerToken?: string; twitterApiKey?: string; twitterApiSecret?: string;
  twitterAccessToken?: string; twitterAccessSecret?: string;
  engagementKeywords?: string; twitterConnected?: boolean;
}

function SecretInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "hsl(240 5% 60%)" }}>{label}</label>
      <div className="relative">
        <input type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || "••••••••••••"}
          className="w-full rounded-lg px-3 py-2 pr-10 text-sm outline-none"
          style={{ background: "hsl(240 8% 10%)", border: "1px solid hsl(240 5% 18%)", color: "hsl(0 0% 90%)" }} />
        <button onClick={() => setShow(!show)} className="absolute right-2.5 top-2" style={{ color: "hsl(240 5% 45%)" }}>
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "hsl(240 5% 60%)" }}>{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
        style={{ background: "hsl(240 8% 10%)", border: "1px solid hsl(240 5% 18%)", color: "hsl(0 0% 90%)" }} />
    </div>
  );
}

export default function SettingsPage() {
  const [form, setForm] = useState<Settings>({});
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: () => fetch("/api/settings").then(r => r.json()).catch(() => ({})),
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMut = useMutation({
    mutationFn: (body: Settings) => fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); },
  });

  const set = (k: keyof Settings) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  if (isLoading) {
    return <div className="flex justify-center pt-20"><Loader2 size={24} className="animate-spin" style={{ color: "hsl(263 70% 58%)" }} /></div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(240 5% 50%)" }}>Configure your artist profile and API connections</p>
      </div>

      {/* Artist info */}
      <div className="rounded-xl border p-5 space-y-4" style={{ background: "hsl(240 8% 7%)", borderColor: "hsl(240 5% 16%)" }}>
        <div className="text-sm font-semibold text-white">Artist Profile</div>
        <TextInput label="Artist Name" value={form.artistName || ""} onChange={set("artistName")} placeholder="Your artist name" />
        <TextInput label="Genre" value={form.genre || ""} onChange={set("genre")} placeholder="Hip-hop, R&B, Pop..." />
        <TextInput label="Engagement Keywords" value={form.engagementKeywords || ""} onChange={set("engagementKeywords")} placeholder="music, new artist, rapper, producer..." />
        <p className="text-xs" style={{ color: "hsl(240 5% 40%)" }}>Comma-separated keywords used to find relevant tweets for the engagement engine</p>
      </div>

      {/* Twitter / X */}
      <div className="rounded-xl border p-5 space-y-4" style={{ background: "hsl(240 8% 7%)", borderColor: "hsl(240 5% 16%)" }}>
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white">Twitter / X API</div>
          {data?.twitterConnected ? (
            <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "hsl(142 71% 45% / 0.15)", color: "hsl(142 71% 60%)", border: "1px solid hsl(142 71% 45% / 0.25)" }}>
              <CheckCircle2 size={11} /> Connected
            </div>
          ) : (
            <div className="text-xs px-2.5 py-1 rounded-full" style={{ background: "hsl(240 6% 13%)", color: "hsl(240 5% 45%)" }}>Not Connected</div>
          )}
        </div>
        <p className="text-xs" style={{ color: "hsl(240 5% 40%)" }}>
          Get credentials at <span className="underline cursor-pointer" style={{ color: "hsl(263 70% 65%)" }}>developer.twitter.com</span>. Required for the Engagement Engine.
        </p>
        <SecretInput label="Bearer Token" value={form.twitterBearerToken || ""} onChange={set("twitterBearerToken")} />
        <div className="grid grid-cols-2 gap-3">
          <SecretInput label="API Key" value={form.twitterApiKey || ""} onChange={set("twitterApiKey")} />
          <SecretInput label="API Secret" value={form.twitterApiSecret || ""} onChange={set("twitterApiSecret")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SecretInput label="Access Token" value={form.twitterAccessToken || ""} onChange={set("twitterAccessToken")} />
          <SecretInput label="Access Secret" value={form.twitterAccessSecret || ""} onChange={set("twitterAccessSecret")} />
        </div>
      </div>

      {/* Save */}
      <button onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        style={{ background: saved ? "hsl(142 71% 45%)" : "hsl(263 70% 58%)" }}>
        {saveMut.isPending ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
          : saved ? <><CheckCircle2 size={16} /> Saved!</>
          : <><Save size={16} /> Save Settings</>}
      </button>
    </div>
  );
}
