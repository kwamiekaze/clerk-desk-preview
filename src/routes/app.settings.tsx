import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile, updateMyProfile } from "@/lib/ai/profile.functions";
import { saveGithubToken, clearGithubToken, getGithubTokenStatus } from "@/lib/ai/github.functions";
import { getUsage } from "@/lib/ai/projects.functions";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Check, Upload, Github } from "lucide-react";
import { ProviderKeysPanel } from "@/components/settings/ProviderKeysPanel";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings — CodingClerks" }] }),
  component: SettingsPage,
});

type Profile = { id: string; email: string | null; plan: string; role: string; display_name: string | null; avatar_url: string | null };
type Usage = { plan: string; buildsUsed: number; buildsCap: number; projectCount: number; projectCap: number };

function SettingsPage() {
  const fetchProfile = useServerFn(getMyProfile);
  const saveProfile = useServerFn(updateMyProfile);
  const saveTok = useServerFn(saveGithubToken);
  const clearTok = useServerFn(clearGithubToken);
  const tokStatus = useServerFn(getGithubTokenStatus);
  const fetchUsage = useServerFn(getUsage);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [savedFlag, setSavedFlag] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [hasToken, setHasToken] = useState(false);
  const [replacingToken, setReplacingToken] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [tokBusy, setTokBusy] = useState(false);
  const [tokErr, setTokErr] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile().then((p) => {
      const prof = p as Profile | null;
      setProfile(prof);
      setDisplayName(prof?.display_name ?? "");
      setAvatarUrl(prof?.avatar_url ?? null);
    });
    fetchUsage().then((u) => setUsage(u as Usage));
    tokStatus().then((t) => setHasToken(t.hasToken));
  }, [fetchProfile, fetchUsage, tokStatus]);

  async function onSaveProfile() {
    setSavingProfile(true);
    try {
      await saveProfile({ data: { display_name: displayName || null, avatar_url: avatarUrl || null } });
      setSavedFlag(true);
      setTimeout(() => setSavedFlag(false), 1500);
    } finally { setSavingProfile(false); }
  }

  async function onPickAvatar(f: File) {
    if (!f.type.startsWith("image/") || f.size > 2 * 1024 * 1024) { alert("Image up to 2MB."); return; }
    setUploadingAvatar(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user?.id;
      if (!uid) return;
      const ext = (f.name.split(".").pop() || "png").toLowerCase().slice(0, 5);
      const key = `${uid}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(key, f, { upsert: true, contentType: f.type });
      if (error) throw new Error(error.message);
      setAvatarUrl(`/api/public/img/avatars/${key}`);
    } catch (e) { alert((e as Error).message); }
    finally { setUploadingAvatar(false); }
  }

  async function onSaveToken() {
    if (!tokenInput.trim()) return;
    setTokBusy(true); setTokErr(null);
    try {
      await saveTok({ data: { token: tokenInput.trim() } });
      setHasToken(true);
      setTokenInput("");
      setReplacingToken(false);
    } catch (e) { setTokErr((e as Error).message); }
    finally { setTokBusy(false); }
  }

  async function onClearToken() {
    if (!confirm("Remove your saved GitHub token?")) return;
    await clearTok();
    setHasToken(false);
  }

  async function signOut() { await supabase.auth.signOut(); window.location.href = "/auth"; }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary text-glow">Settings</div>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Your account</h1>

      <section className="mt-8 rounded-2xl border border-border bg-surface/60 p-6 backdrop-blur-md">
        <h2 className="font-mono text-xs uppercase tracking-wider text-primary">Profile</h2>
        <div className="mt-4 flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full border border-border bg-background">
            {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center font-mono text-xs text-mute">{profile?.email?.[0]?.toUpperCase() ?? "?"}</div>}
          </div>
          <div>
            <button onClick={() => fileRef.current?.click()} disabled={uploadingAvatar}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-mute hover:border-primary/60 hover:text-primary">
              {uploadingAvatar ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Upload avatar
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickAvatar(f); }} />
            <div className="mt-1 font-mono text-[10px] text-mute">PNG/JPG · up to 2MB</div>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase text-mute">Display name</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase text-mute">Email</label>
            <input value={profile?.email ?? ""} readOnly className="w-full rounded-md border border-border bg-background/40 px-3 py-2 text-sm text-mute" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={onSaveProfile} disabled={savingProfile}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {savingProfile ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
          </button>
          {savedFlag && <span className="inline-flex items-center gap-1 font-mono text-[10px] text-primary"><Check className="h-3 w-3" /> Saved</span>}
        </div>
      </section>

      {usage && (
        <section className="mt-6 rounded-2xl border border-border bg-surface/60 p-6 backdrop-blur-md">
          <h2 className="font-mono text-xs uppercase tracking-wider text-primary">Plan &amp; usage</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Stat label="Plan" value={usage.plan.toUpperCase()} />
            <Stat label="Builds (30d)" value={`${usage.buildsUsed} / ${usage.plan === "pro" ? "∞" : usage.buildsCap}`} />
            <Stat label="Projects" value={`${usage.projectCount} / ${usage.plan === "pro" ? "∞" : usage.projectCap}`} />
          </div>
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-border bg-surface/60 p-6 backdrop-blur-md">
        <div className="flex items-center gap-2"><Github className="h-4 w-4 text-primary" /><h2 className="font-mono text-xs uppercase tracking-wider text-primary">GitHub</h2></div>
        <p className="mt-2 text-xs text-mute">Paste a Personal Access Token with <code>repo</code> scope. Stored securely; never shown again. Used to push your projects and pull repos back in.</p>
        {hasToken && !replacingToken ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-[11px] text-primary">
              <Check className="h-3 w-3" /> Token saved
            </span>
            <button onClick={() => setReplacingToken(true)} className="rounded-md border border-border px-2.5 py-1 text-xs text-mute hover:text-foreground">Replace</button>
            <button onClick={onClearToken} className="rounded-md border border-border px-2.5 py-1 text-xs text-mute hover:text-destructive">Remove</button>
          </div>
        ) : (
          <div className="mt-4">
            <input type="password" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="ghp_…"
              autoComplete="off"
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary/60" />
            {tokErr && <div className="mt-2 text-xs text-destructive">{tokErr}</div>}
            <div className="mt-3 flex gap-2">
              <button onClick={onSaveToken} disabled={tokBusy || !tokenInput.trim()}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                {tokBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save token
              </button>
              {replacingToken && <button onClick={() => { setReplacingToken(false); setTokenInput(""); }} className="rounded-md border border-border px-3 py-1.5 text-xs text-mute">Cancel</button>}
            </div>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-surface/60 p-6 backdrop-blur-md">
        <h2 className="font-mono text-xs uppercase tracking-wider text-primary">Session</h2>
        <button onClick={signOut} className="mt-3 rounded-md border border-border px-3 py-1.5 text-xs text-mute hover:border-destructive/60 hover:text-destructive">
          Sign out
        </button>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-3">
      <div className="font-mono text-[10px] uppercase text-mute">{label}</div>
      <div className="mt-1 text-lg font-medium text-glow">{value}</div>
    </div>
  );
}
