import { useEffect, useMemo, useState } from "react";
import { Crown, Mail, MessageSquare, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEvStore } from "@/store/evStore";

/**
 * Main-admin (super-admin) operational console. Provides:
 *  - Live KPIs across the whole network
 *  - Per-station-manager directory with their stations + quick edit links
 *  - Lightweight messaging surface (locally persisted) so the main admin can
 *    push announcements to managers. Hook into a Supabase `messages` table
 *    later — the UI is intentionally generic.
 */

interface AdminMessage { id: string; to: string; subject: string; body: string; created_at: string; }
const MSG_KEY = "ev.admin.messages.v1";

function loadMsgs(): AdminMessage[] { try { return JSON.parse(localStorage.getItem(MSG_KEY) ?? "[]"); } catch { return []; } }
function saveMsgs(m: AdminMessage[]) { localStorage.setItem(MSG_KEY, JSON.stringify(m)); }

export function MainAdminConsole() {
  const { isSuperAdmin, stations, rolesList, loadRoles, changeUserRole, toggleStationActive } = useEvStore();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [to, setTo] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => { if (isSuperAdmin) void loadRoles(); }, [isSuperAdmin, loadRoles]);
  useEffect(() => { setMessages(loadMsgs()); }, []);

  const managers = useMemo(() => rolesList.filter((r) => r.role === "admin" || r.role === "super_admin"), [rolesList]);
  const totalRevenuePerDay = stations.reduce((sum, s) => sum + Math.round((s.total_slots - s.available_slots) * 24 * s.price_per_kwh), 0);
  const offlineCount = stations.filter((s) => s.active === false).length;

  if (!isSuperAdmin) return null;

  function send() {
    if (!to || !subject.trim()) return;
    const next = [{ id: crypto.randomUUID(), to, subject: subject.trim(), body: body.trim(), created_at: new Date().toISOString() }, ...messages];
    setMessages(next); saveMsgs(next); setSubject(""); setBody("");
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      <div className="glass-panel premium-border space-y-4 rounded-3xl border p-6">
        <div className="flex items-center gap-2">
          <Crown className="size-5 text-amber-500" />
          <h2 className="text-2xl font-black">Main admin · network overview</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Stations" value={stations.length} />
          <Stat label="Managers" value={managers.length} />
          <Stat label="Offline stations" value={offlineCount} />
          <Stat label="Est. revenue / day" value={`₹${totalRevenuePerDay.toLocaleString()}`} />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Station managers · {managers.length}</p>
          <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">
            {managers.length === 0 ? <p className="rounded-lg bg-secondary p-2 text-xs text-muted-foreground">No managers yet — promote a user from Super-admin · role manager.</p> : null}
            {managers.map((m) => (
              <div key={m.id} className="rounded-2xl bg-secondary p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {m.role === "super_admin" ? <Crown className="size-4 text-amber-500" /> : <ShieldCheck className="size-4 text-primary" />}
                    <span className="font-mono text-xs">{m.user_id}</span>
                    <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-bold uppercase">{m.role}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" onClick={() => setTo(m.user_id)}><Mail className="size-3.5" /> Message</Button>
                    <Button size="icon" variant="ghost" aria-label="Revoke" onClick={() => void changeUserRole(m.user_id, "user")}><Trash2 className="size-4" /></Button>
                  </div>
                </div>
                {/* Stations a manager owns aren't tracked yet; show all when one manager exists.
                    When ownership is added, swap this for `stations.filter(s => s.manager_id === m.user_id)`. */}
                <div className="mt-2 grid gap-1">
                  {stations.slice(0, 4).map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg bg-card/60 p-2 text-xs">
                      <span>{s.name}</span>
                      <Button size="sm" variant={s.active === false ? "destructive" : "secondary"} onClick={() => void toggleStationActive(s.id, s.active === false)}>
                        {s.active === false ? "Turn ON" : "Turn OFF"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel premium-border space-y-3 rounded-3xl border p-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-5 text-primary" />
          <h2 className="text-2xl font-black">Messages to managers</h2>
        </div>
        <select value={to} onChange={(e) => setTo(e.target.value)} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm">
          <option value="">Select recipient…</option>
          {managers.map((m) => <option key={m.user_id} value={m.user_id}>{m.role} · {m.user_id.slice(0, 8)}…</option>)}
        </select>
        <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <Textarea placeholder="Message body" value={body} onChange={(e) => setBody(e.target.value)} className="min-h-24" />
        <Button variant="hero" onClick={send} disabled={!to || !subject.trim()}><Mail className="size-4" /> Send</Button>

        <div className="pt-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent · {messages.length}</p>
          <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
            {messages.length === 0 ? <p className="rounded-lg bg-secondary p-2 text-xs text-muted-foreground">No messages yet.</p> : null}
            {messages.map((m) => (
              <div key={m.id} className="rounded-lg bg-secondary p-2 text-xs">
                <p className="font-semibold">{m.subject}</p>
                <p className="text-muted-foreground">to {m.to.slice(0, 10)}… · {new Date(m.created_at).toLocaleString()}</p>
                {m.body ? <p className="mt-1 whitespace-pre-line">{m.body}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-secondary p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}