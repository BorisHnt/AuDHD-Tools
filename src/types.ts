export type AnswerKind = "value" | "unknown" | "not-applicable" | "skipped";

export interface Answer {
  kind: AnswerKind;
  optionId?: string;
  value?: number;
}

export interface ResponseOption {
  id: string;
  labelFr: string;
  value: number;
}

export interface ResponseScale {
  id: string;
  options: ResponseOption[];
}

export interface TestItem {
  itemId: string;
  family: "adhd" | "autism";
  textFr: string;
  conceptId: string;
  dimensionId: string;
  role: string;
  responseScale: string;
  scoring: { type: "direct" | "flag"; triggerAt?: number; minimum?: number; maximum?: number };
  reviewStatus: string;
}

export interface TestTheme {
  id: string;
  number: number;
  titleFr: string;
  expectedQuestions: number;
  role: string;
}

export interface TestInstance {
  instanceId: string;
  itemId: string;
  position: number;
  themeId: string;
}

export interface TestManifest {
  id: string;
  family: "adhd" | "autism";
  size: number;
  titleFr: string;
  themes: TestTheme[];
  instances: TestInstance[];
}

export interface TestsData {
  schemaVersion: string;
  source: { fileName: string; sha256: string; occurrenceCount: number };
  responseScales: ResponseScale[];
  items: TestItem[];
  tests: TestManifest[];
}

export type WavePhase = "understand" | "before" | "during" | "after" | "prevent";

export interface WavePage {
  id: string;
  number: number;
  phase: WavePhase;
  phaseLabelFr: string;
  contentLines: string[];
}

export interface WaveModule {
  id: string;
  number: number;
  titleFr: string;
  slug: string;
  pages: WavePage[];
}

export interface WaveCollection {
  id: string;
  titleFr: string;
  descriptionFr: string;
  modules: WaveModule[];
}

export interface WavesData {
  schemaVersion: string;
  phases: Array<{ id: WavePhase; labelFr: string }>;
  collections: WaveCollection[];
}

export interface TestSession {
  id: string;
  testId: string;
  startedAt: string;
  updatedAt: string;
  cursor: number;
  answers: Record<string, Answer>;
}

export type WaveFieldValue = string | boolean;

export interface WaveEpisode {
  id: string;
  collectionId: string;
  moduleId: string;
  startedAt: string;
  updatedAt: string;
  answers: Record<string, Record<string, WaveFieldValue>>;
}

export interface Preferences {
  fontScale: "normal" | "large" | "x-large";
  contrast: "standard" | "high";
  theme: "light" | "dark";
  density: "comfortable" | "compact";
  reduceMotion: boolean;
}

export interface AppState {
  format: "AuDHD-State";
  version: 1;
  testSessions: TestSession[];
  waveEpisodes: WaveEpisode[];
  recentModules: string[];
  preferences: Preferences;
}
