import { create } from "zustand";
import type { QueueEntry, Station, StationFilters, Transaction, UserProfile, Verification } from "@/types/ev";
import { demoUser, stations as seedStations } from "@/services/seedData";
import { createUpiTransaction, fetchQueue, fetchStations, joinStationQueue, submitVerification } from "@/services/evApi";
import { getCurrentAuth, signInWithEmail, signInWithGoogle, signOutUser, signUpWithEmail } from "@/services/authApi";
import type { LatLng, RouteResult } from "@/lib/geo";
import { isSupabaseConfigured, supabase } from "@/services/supabaseClient";

export const guestUser: UserProfile = {
  ...demoUser,
  id: "guest",
  name: "Guest",
  email: "guest@local",
  coins: 0,
};

interface EvState {
  user: UserProfile;
  authReady: boolean;
  authError: string;
  isAuthenticated: boolean;
  isAdmin: boolean;
  stations: Station[];
  selectedStationId: string;
  filters: StationFilters;
  batteryPercent: number;
  queues: Record<string, QueueEntry[]>;
  verifications: Verification[];
  transactions: Transaction[];
  liveLocation: LatLng | null;
  setLiveLocation: (loc: LatLng | null) => void;
  activeRoute: RouteResult | null;
  setActiveRoute: (r: RouteResult | null) => void;
  addStation: (s: Station) => void;
  updateStation: (id: string, patch: Partial<Station>) => void;
  removeStation: (id: string) => void;
  loadAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (input: { name: string; email: string; password: string; phone?: string; vehicleModel?: string }) => Promise<void>;
  logout: () => Promise<void>;
  setSelectedStation: (stationId: string) => void;
  setFilters: (filters: Partial<StationFilters>) => void;
  setBatteryPercent: (value: number) => void;
  loadStations: () => Promise<void>;
  refreshQueue: (stationId: string) => Promise<void>;
  joinQueue: (stationId: string) => Promise<void>;
  checkIn: (stationId: string) => void;
  startCharging: (stationId: string) => void;
  completePayment: (stationId: string, amount: number) => Promise<void>;
  verifyStation: (stationId: string, status: Verification["status"], cable_condition: Verification["cable_condition"]) => Promise<void>;
}

const defaultFilters: StationFilters = {
  chargerType: "all",
  availability: "all",
  connector: "all",
  city: "all",
  maxDistance: 40,
  maxPrice: 25,
};

export const useEvStore = create<EvState>((set, get) => ({
  user: guestUser,
  authReady: false,
  authError: "",
  isAuthenticated: false,
  isAdmin: false,
  stations: seedStations,
  selectedStationId: seedStations[0].id,
  filters: defaultFilters,
  batteryPercent: 42,
  queues: {},
  verifications: [],
  transactions: [],
  liveLocation: null,
  setLiveLocation: (loc) => set({ liveLocation: loc }),
  activeRoute: null,
  setActiveRoute: (r) => set({ activeRoute: r }),
  addStation: (s) => set((st) => ({ stations: [s, ...st.stations] })),
  updateStation: (id, patch) =>
    set((st) => ({ stations: st.stations.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
  removeStation: (id) =>
    set((st) => ({ stations: st.stations.filter((x) => x.id !== id) })),
  loadAuth: async () => {
    try {
      const auth = await getCurrentAuth();
      const isAuthenticated = Boolean(auth.user);
      let isAdmin = false;
      if (isAuthenticated && isSupabaseConfigured && supabase && auth.user) {
        const { data } = await supabase.from("user_roles").select("role").eq("user_id", auth.user.id);
        isAdmin = (data ?? []).some((r) => r.role === "admin");
      }
      set({
        user: isAuthenticated ? auth.profile : guestUser,
        isAuthenticated,
        isAdmin,
        authReady: true,
        authError: "",
      });
    } catch (error) {
      set({ authReady: true, authError: error instanceof Error ? error.message : "Could not load auth" });
    }
  },
  login: async (email, password) => {
    const auth = await signInWithEmail(email, password);
    set({ user: auth.profile, isAuthenticated: Boolean(auth.user), authError: "" });
    await get().loadAuth();
  },
  loginWithGoogle: async () => {
    const auth = await signInWithGoogle();
    set({ user: auth.profile, isAuthenticated: Boolean(auth.user), authError: "" });
  },
  signup: async (input) => {
    const auth = await signUpWithEmail(input);
    set({ user: auth.profile, isAuthenticated: Boolean(auth.user), authError: "" });
    await get().loadAuth();
  },
  logout: async () => {
    await signOutUser();
    set({ user: guestUser, isAuthenticated: false, isAdmin: false });
  },
  loadStations: async () => {
    try {
      const loadedStations = await fetchStations();
      const safeStations = loadedStations.length > 0 ? loadedStations : seedStations;
      const currentSelection = get().selectedStationId;
      const selectedStationId = safeStations.some((station) => station.id === currentSelection) ? currentSelection : safeStations[0].id;
      set({ stations: safeStations, selectedStationId });
    } catch (error) {
      set({ stations: seedStations, selectedStationId: seedStations[0].id });
    }
  },
  setSelectedStation: (stationId) => set({ selectedStationId: stationId }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  setBatteryPercent: (batteryPercent) => set({ batteryPercent }),
  refreshQueue: async (stationId) => {
    try {
      const queue = await fetchQueue(stationId);
      set((state) => ({ queues: { ...state.queues, [stationId]: queue } }));
    } catch (error) {
      set((state) => ({ queues: { ...state.queues, [stationId]: [] } }));
    }
  },
  joinQueue: async (stationId) => {
    const { user } = get();
    const entry = await joinStationQueue(stationId, user.id, user.name);
    set((state) => ({
      queues: { ...state.queues, [stationId]: [...(state.queues[stationId] ?? []), entry] },
      user: { ...state.user, coins: state.user.coins + 25 },
    }));
  },
  checkIn: (stationId) => {
    const { user } = get();
    set((state) => ({
      queues: {
        ...state.queues,
        [stationId]: (state.queues[stationId] ?? []).map((entry) =>
          entry.user_id === user.id ? { ...entry, status: "arrived" } : entry,
        ),
      },
    }));
  },
  startCharging: (stationId) => {
    const { user } = get();
    set((state) => ({
      queues: {
        ...state.queues,
        [stationId]: (state.queues[stationId] ?? []).map((entry) =>
          entry.user_id === user.id ? { ...entry, status: "charging", eta_minutes: 0 } : entry,
        ),
      },
      stations: state.stations.map((station) =>
        station.id === stationId
          ? { ...station, available_slots: Math.max(0, station.available_slots - 1), status: "busy" }
          : station,
      ),
    }));
  },
  completePayment: async (stationId, amount) => {
    const { user } = get();
    const transaction = await createUpiTransaction(user.id, amount);
    set((state) => ({
      transactions: [transaction, ...state.transactions],
      user: { ...state.user, coins: state.user.coins + Math.round(amount / 10) },
      queues: {
        ...state.queues,
        [stationId]: (state.queues[stationId] ?? []).filter((entry) => entry.user_id !== user.id),
      },
      stations: state.stations.map((station) =>
        station.id === stationId ? { ...station, available_slots: Math.min(station.total_slots, station.available_slots + 1) } : station,
      ),
    }));
  },
  verifyStation: async (stationId, status, cable_condition) => {
    const { user } = get();
    const verification = await submitVerification({ station_id: stationId, user_id: user.id, status, cable_condition });
    set((state) => ({
      verifications: [verification, ...state.verifications],
      user: { ...state.user, coins: state.user.coins + 75 },
      stations: state.stations.map((station) =>
        station.id === stationId
          ? {
              ...station,
              reliability_score: Math.max(40, Math.min(99, station.reliability_score + (status === "working" ? 2 : -8))),
              last_verified: "just now",
            }
          : station,
      ),
    }));
  },
}));
