export interface DailyNote {
  id: string; // YYYY-MM-DD
  message: string;
  color_vibe: string;
  authorUid: string;
  createdAt: any; // Firestore Timestamp
}
