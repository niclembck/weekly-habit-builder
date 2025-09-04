export type Day = "Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday"|"Saturday"|"Sunday";
export type DayEntry = {
  morningNotes?: string;
  middayNotes?: string;
  activityNotes?: string;
  morningProject: string;
  middayProject: string;
  activity: string;
  therapy?: boolean;
  notes?: string;
  gratitude?: string;
  doneMorning?: boolean;
  doneMidday?: boolean;
  doneActivity?: boolean;
  mood?: number | null;
};
export type WeekData = Record<Day, DayEntry>;
export type Settings = {
  defaults?: Defaults
  patterns?: Patterns
  templates?: WeekTemplate[]

  projects: string[];
  activityColors: Record<string, string>;
  projectEmojis: Record<string, string>;
  activityEmojis: Record<string, string>;
  theme?: 'blue'|'teal'|'emerald';
  dark?: boolean;
};
export type ExportBundle = { weekStart: string; week: WeekData; settings: Settings }


export type Defaults = {
  morning?: string | null
  midday?: string | null
  activity?: string | null
  useTemplatesFirst?: boolean
}

export type PatternDay = { morning?: string | null; midday?: string | null; activity?: string | null }
export type Patterns = { Mon?: PatternDay; Tue?: PatternDay; Wed?: PatternDay; Thu?: PatternDay; Fri?: PatternDay; Sat?: PatternDay; Sun?: PatternDay }

export type WeekTemplate = {
  id: string
  name: string
  days: {
    Mon: PatternDay; Tue: PatternDay; Wed: PatternDay; Thu: PatternDay; Fri: PatternDay; Sat: PatternDay; Sun: PatternDay
  }
}

declare module './index' { }
