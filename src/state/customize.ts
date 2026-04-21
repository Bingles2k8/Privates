import { create } from 'zustand';
import { loadSettings, saveSettings } from '@/data/settings';
import type { CustomizeScreen } from '@/ui/customizeSections';

type CustomizeState = {
  today: string[];
  insights: string[];
  /**
   * User-defined ordering of section IDs per screen. If empty, the catalog's
   * default order is used. Any section ID not present in the stored order is
   * appended at its catalog position when rendering (see `orderedIds`).
   */
  todayOrder: string[];
  insightsOrder: string[];
  /** Transient — when set to a screen, that screen is in reorder mode. */
  reorderMode: CustomizeScreen | null;
  hydrated: boolean;
  isHidden: (screen: CustomizeScreen, id: string) => boolean;
  hide: (screen: CustomizeScreen, id: string) => void;
  show: (screen: CustomizeScreen, id: string) => void;
  toggle: (screen: CustomizeScreen, id: string) => void;
  resetScreen: (screen: CustomizeScreen) => void;
  moveUp: (screen: CustomizeScreen, id: string, catalog: readonly string[]) => void;
  moveDown: (screen: CustomizeScreen, id: string, catalog: readonly string[]) => void;
  enterReorder: (screen: CustomizeScreen) => void;
  exitReorder: () => void;
  hydrate: (next: {
    today: string[];
    insights: string[];
    todayOrder: string[];
    insightsOrder: string[];
  }) => void;
};

/**
 * Merge stored order with the catalog: start from stored order, drop any
 * entries no longer in the catalog, then append any catalog entries missing
 * from storage at their catalog position.
 */
export function mergeOrder(stored: string[], catalog: readonly string[]): string[] {
  const catalogSet = new Set(catalog);
  const kept = stored.filter((id) => catalogSet.has(id));
  const keptSet = new Set(kept);
  const tail: string[] = [];
  catalog.forEach((id) => {
    if (!keptSet.has(id)) tail.push(id);
  });
  return [...kept, ...tail];
}

function orderKey(screen: CustomizeScreen): 'todayOrder' | 'insightsOrder' {
  return screen === 'today' ? 'todayOrder' : 'insightsOrder';
}

export const useCustomize = create<CustomizeState>((set, get) => ({
  today: [],
  insights: [],
  todayOrder: [],
  insightsOrder: [],
  reorderMode: null,
  hydrated: false,
  isHidden: (screen, id) => get()[screen].includes(id),
  hide: (screen, id) => {
    const cur = get()[screen];
    if (cur.includes(id)) return;
    const next = [...cur, id];
    set(screen === 'today' ? { today: next } : { insights: next });
    void persistCustomize({ [screen]: next } as { today?: string[]; insights?: string[] });
  },
  show: (screen, id) => {
    const cur = get()[screen];
    if (!cur.includes(id)) return;
    const next = cur.filter((x) => x !== id);
    set(screen === 'today' ? { today: next } : { insights: next });
    void persistCustomize({ [screen]: next } as { today?: string[]; insights?: string[] });
  },
  toggle: (screen, id) => {
    if (get().isHidden(screen, id)) get().show(screen, id);
    else get().hide(screen, id);
  },
  resetScreen: (screen) => {
    // Clear both the hidden list and the ordering so the screen goes back
    // to the catalog default.
    const hiddenPatch = screen === 'today' ? { today: [] } : { insights: [] };
    const orderPatch =
      screen === 'today' ? { todayOrder: [] as string[] } : { insightsOrder: [] as string[] };
    set({ ...hiddenPatch, ...orderPatch });
    void persistCustomize({
      [screen]: [],
      [orderKey(screen)]: [],
    } as {
      today?: string[];
      insights?: string[];
      todayOrder?: string[];
      insightsOrder?: string[];
    });
  },
  moveUp: (screen, id, catalog) => {
    const key = orderKey(screen);
    const merged = mergeOrder(get()[key], catalog);
    const idx = merged.indexOf(id);
    if (idx <= 0) return;
    const next = [...merged];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    set({ [key]: next } as Partial<CustomizeState>);
    void persistCustomize({ [key]: next } as {
      todayOrder?: string[];
      insightsOrder?: string[];
    });
  },
  moveDown: (screen, id, catalog) => {
    const key = orderKey(screen);
    const merged = mergeOrder(get()[key], catalog);
    const idx = merged.indexOf(id);
    if (idx < 0 || idx >= merged.length - 1) return;
    const next = [...merged];
    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
    set({ [key]: next } as Partial<CustomizeState>);
    void persistCustomize({ [key]: next } as {
      todayOrder?: string[];
      insightsOrder?: string[];
    });
  },
  enterReorder: (screen) => set({ reorderMode: screen }),
  exitReorder: () => set({ reorderMode: null }),
  hydrate: (next) => set({ ...next, hydrated: true }),
}));

export async function hydrateCustomizeFromSettings(): Promise<void> {
  try {
    const s = await loadSettings();
    useCustomize.getState().hydrate({
      today: s.customize?.today ?? [],
      insights: s.customize?.insights ?? [],
      todayOrder: s.customize?.todayOrder ?? [],
      insightsOrder: s.customize?.insightsOrder ?? [],
    });
  } catch {
    useCustomize.setState({ hydrated: true });
  }
}

export async function persistCustomize(next: {
  today?: string[];
  insights?: string[];
  todayOrder?: string[];
  insightsOrder?: string[];
}): Promise<void> {
  const cur = await loadSettings();
  await saveSettings({
    ...cur,
    customize: {
      today: next.today ?? cur.customize.today,
      insights: next.insights ?? cur.customize.insights,
      todayOrder: next.todayOrder ?? cur.customize.todayOrder ?? [],
      insightsOrder: next.insightsOrder ?? cur.customize.insightsOrder ?? [],
    },
  });
}
