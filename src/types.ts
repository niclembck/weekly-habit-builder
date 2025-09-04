 export type Day = 'Monday'|'Tuesday'|'Wednesday'|'Thursday'|'Friday'|'Saturday'|'Sunday'

+export type TimeRange = { start: string; end: string } // "HH:MM" 24h (HTML <input type="time"> friendly)

 export type Settings = {
   projects: string[]
   activityColors: Record<string,string>
   projectEmojis: Record<string,string>
   activityEmojis: Record<string,string>
+  suggestedSlots?: {
+    morning: TimeRange
+    midday: TimeRange
+    activity: TimeRange
+  }
 }

 export type DayEntry = {
   morningProject?: string
   middayProject?: string
   activity?: string
   doneMorning?: boolean
   doneMidday?: boolean
   doneActivity?: boolean
   morningNotes?: string
   middayNotes?: string
   activityNotes?: string
   gratitude?: string
   notes?: string
   mood?: number|null
   therapy?: boolean
+  // Actual time overrides (user-entered when different from suggested)
+  morningActualStart?: string // "08:00"
+  morningActualEnd?: string   // "10:00"
+  middayActualStart?: string
+  middayActualEnd?: string
+  activityActualStart?: string
+  activityActualEnd?: string
 }
