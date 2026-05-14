import { useEffect, useState } from "react";
import { Crown, ShieldCheck, UserCog, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEvStore } from "@/store/evStore";
import type { AppRole } from "@/types/ev";

/**
 * Super-admin only. Lists all role assignments and lets the super-admin
 * promote / demote users. To avoid a profiles-wide read (RLS protected),
 * promotion is by user-id (UUID).
 */
export function SuperAdminPanel() {
  const { isSuperAdmin, rolesList, loadRoles, changeUserRole } = useEvStore();
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<AppRole>("admin");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { if (isSuperAdmin) void loadRoles(); }, [isSuperAdmin, loadRoles]);

  if (!isSuperAdmin) {
    return (
      <div className="glass-panel premium-border rounded-3xl border p-6 text-sm text-muted-foreground">
        <Crown className="mb-2 size-5 text-amber-500" />
        Super-admin area. Only the main administrator can manage other admins. Promote your account to <code>super_admin</code> in the database (see DOCS.md).
      </div>
    );
  }

  async function apply() {
    setBusy(true); setMsg("");
    try { await changeUserRole(userId.trim(), role); setMsg(`Updated to ${role}.`); setUserId(""); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  }

  return (
    <section className="glass-panel premium-border space-y-4 rounded-3xl border p-6">
      <div className="flex items-center gap-2">
        <Crown className="size-5 text-amber-500" />
        <h2 className="text-2xl font-black">Super-admin · role manager</h2>
      </div>
      <p className="text-sm text-muted-foreground">Promote users to <b>admin</b> (manage stations) or <b>super_admin</b> (manage other admins). Use the user's UUID — find it in the auth panel after sign-in.</p>

      <div className="grid gap-2 sm:grid-cols-[1fr_160px_120px]">
        <Input placeholder="User UUID (auth.users.id)" value={userId} onChange={(e) => setUserId(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value as AppRole)} className="h-10 rounded-md border border-input bg-card px-3 text-sm">
          <option value="user">user</option>
          <option value="admin">admin</option>
          <option value="super_admin">super_admin</option>
        </select>
        <Button variant="hero" onClick={() => void apply()} disabled={busy || !userId.trim()}>
          <UserCog className="size-4" /> Apply
        </Button>
      </div>
      {msg ? <p className="text-xs text-muted-foreground">{msg}</p> : null}

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Existing role assignments · {rolesList.length}</p>
        <div className="mt-2 max-h-72 space-y-1 overflow-y-auto">
          {rolesList.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl bg-secondary p-2.5 text-sm">
              <div className="flex items-center gap-2">
                {r.role === "super_admin" ? <Crown className="size-4 text-amber-500" /> : r.role === "admin" ? <ShieldCheck className="size-4 text-primary" /> : <UserCog className="size-4 text-muted-foreground" />}
                <span className="font-mono text-xs">{r.user_id}</span>
                <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-bold uppercase">{r.role}</span>
              </div>
              <Button size="icon" variant="ghost" aria-label="Demote" onClick={() => void changeUserRole(r.user_id, "user")}>
                <UserMinus className="size-4" />
              </Button>
            </div>
          ))}
          {rolesList.length === 0 ? <p className="rounded-lg bg-secondary p-2 text-xs text-muted-foreground">No role rows visible.</p> : null}
        </div>
      </div>
    </section>
  );
}
