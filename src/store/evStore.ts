import { create } from "zustand";
import type { QueueEntry, Station, StationFilters, Transaction, Verification } from "@/types/ev";
import { demoUser, stations as seedStations } from "@/services/seedData";
import { createUpiTransaction, fetchQueue, fetchStations, joinStationQueue, submitVerification } from "@/services/evApi";

interface EvState {
  user: typeof demoUser;
  stations: Station[];
  selectedStationId: string;
  filters: StationFilters;
  batteryPercent: number;
  queues: Record<string, QueueEntry[]>;
  verifications: Verification[];
  transactions: Transaction[];
  activeTab: "map" | "queue" | "pay" | "rewards" | "admin";
  loadStations: () => Promise<void>;
  setSelectedStation: (stationId: string) => void;
  setFilters: (filters: Partial<StationFilters>) => void;
  setBatteryPercent: (value: number) => void;
  setActiveTab: (tab: EvState["activeTab"]) => void;
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
  maxDistance: 30,
  maxPrice: 25,
};

export const useEvStore = create<EvState>((set, get) => ({
  user: demoUser,
  stations: seedStations,
  selectedStationId: seedStations[0].id,
  filters: defaultFilters,
  batteryPercent: 42,
  queues: {},
  verifications: [],
  transactions: [],
  activeTab: "map",
  loadStations: async () => {
    const loadedStations = await fetchStations();
    set({ stations: loadedStations, selectedStationId: loadedStations[0]?.id ?? get().selectedStationId });
  },
  setSelectedStation: (stationId) => set({ selectedStationId: stationId }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  setBatteryPercent: (batteryPercent) => set({ batteryPercent }),
  setActiveTab: (activeTab) => set({ activeTab }),
  refreshQueue: async (stationId) => {
    const queue = await fetchQueue(stationId);
    set((state) => ({ queues: { ...state.queues, [stationId]: queue } }));
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
