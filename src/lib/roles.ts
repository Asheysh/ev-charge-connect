/**
 * Centralised role configuration. Edit this file to add/remove demo accounts
 * or change which emails map to which app role. Email comparison is
 * case-insensitive.
 *
 * The database is still the source of truth for RLS-protected actions; this
 * file only drives client-side UI gating and the convenience "demo login"
 * buttons on the auth page.
 */

import type { AppRole } from "@/types/ev";

export interface DemoAccount {
  label: string;
  email: string;
  password: string;
  role: AppRole;
}

export const MAIN_ADMIN_EMAIL = "ev.station.admin.main@gmail.com";

export const STATION_MANAGER_EMAILS = [
  "ev.station.manager.1@gmail.com",
  "ev.station.manager.2@gmail.com",
];

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { label: "Main Admin", email: MAIN_ADMIN_EMAIL, password: "4KGQiQ3A2E70Dj4v", role: "super_admin" },
  { label: "Station Manager #1", email: STATION_MANAGER_EMAILS[0], password: "Stationmanager1", role: "admin" },
  { label: "Station Manager #2", email: STATION_MANAGER_EMAILS[1], password: "Stationmanager2", role: "admin" },
];

/** Returns the elevated role inferred from a user's email, or null. */
export function roleFromEmail(email: string | null | undefined): AppRole | null {
  if (!email) return null;
  const e = email.toLowerCase();
  if (e === MAIN_ADMIN_EMAIL.toLowerCase()) return "super_admin";
  if (STATION_MANAGER_EMAILS.map((x) => x.toLowerCase()).includes(e)) return "admin";
  return null;
}