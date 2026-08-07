import type { AppState, Preferences, TestSession, WaveEpisode } from "./types";

const STORAGE_KEY = "audhd-tools:state:v1";
const CONSENT_KEY = "audhd-tools:storage-consent";

const defaultPreferences: Preferences = {
  fontScale: "normal",
  contrast: "standard",
  theme: "light",
  density: "comfortable",
  reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
};

const createDefaultState = (): AppState => ({
  format: "AuDHD-State",
  version: 1,
  testSessions: [],
  waveEpisodes: [],
  recentModules: [],
  preferences: defaultPreferences
});

const readStoredState = (): AppState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;
    return parsed.format === "AuDHD-State" && parsed.version === 1 ? parsed : null;
  } catch {
    return null;
  }
};

let persistent = localStorage.getItem(CONSENT_KEY) === "accepted";
let state = (persistent && readStoredState()) || createDefaultState();

const save = () => {
  if (persistent) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const getStorageConsent = () => localStorage.getItem(CONSENT_KEY);

export const setStorageConsent = (accepted: boolean) => {
  persistent = accepted;
  localStorage.setItem(CONSENT_KEY, accepted ? "accepted" : "declined");
  if (accepted) save();
};

export const isPersistent = () => persistent;
export const getState = () => state;

export const replaceState = (nextState: AppState) => {
  if (nextState.format !== "AuDHD-State" || nextState.version !== 1) throw new Error("Format de session incompatible.");
  state = nextState;
  save();
};

export const updatePreferences = (preferences: Partial<Preferences>) => {
  state.preferences = { ...state.preferences, ...preferences };
  save();
};

export const createTestSession = (testId: string): TestSession => {
  const now = new Date().toISOString();
  const session: TestSession = {
    id: crypto.randomUUID(),
    testId,
    startedAt: now,
    updatedAt: now,
    cursor: 0,
    answers: {}
  };
  state.testSessions.unshift(session);
  save();
  return session;
};

export const getTestSession = (id: string) => state.testSessions.find((session) => session.id === id);

export const updateTestSession = (id: string, update: Partial<TestSession>) => {
  const session = getTestSession(id);
  if (!session) return;
  Object.assign(session, update, { updatedAt: new Date().toISOString() });
  save();
};

export const createWaveEpisode = (collectionId: string, moduleId: string): WaveEpisode => {
  const now = new Date().toISOString();
  const episode: WaveEpisode = {
    id: crypto.randomUUID(),
    collectionId,
    moduleId,
    startedAt: now,
    updatedAt: now,
    answers: {}
  };
  state.waveEpisodes.unshift(episode);
  state.recentModules = [moduleId, ...state.recentModules.filter((id) => id !== moduleId)].slice(0, 6);
  save();
  return episode;
};

export const getWaveEpisode = (id: string) => state.waveEpisodes.find((episode) => episode.id === id);

export const updateWaveField = (episodeId: string, pageId: string, fieldId: string, value: string | boolean) => {
  const episode = getWaveEpisode(episodeId);
  if (!episode) return;
  episode.answers[pageId] ||= {};
  episode.answers[pageId][fieldId] = value;
  episode.updatedAt = new Date().toISOString();
  save();
};

export const clearAllLocalData = () => {
  state = createDefaultState();
  localStorage.removeItem(STORAGE_KEY);
  save();
};
