import fs from 'fs';
import path from 'path';

export interface ConversationEvent {
  type: 'start' | 'end' | 'analysis' | 'feedback' | 'transcript';
  userId: string;
  timestamp: number;
  data: any;
}

export class ConversationStore {
  private filePath: string = path.join(__dirname, '../data/conversations.json');
  private events: ConversationEvent[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf8');
        return;
      }
      const raw = fs.readFileSync(this.filePath, 'utf8');
      this.events = raw.trim() ? JSON.parse(raw) : [];
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('ConversationStore load failed:', e);
      this.events = [];
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.events, null, 2), 'utf8');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('ConversationStore save failed:', e);
    }
  }

  append(event: ConversationEvent): void {
    this.events.push(event);
    // Basic retention: keep last 10k events
    if (this.events.length > 10000) this.events.splice(0, this.events.length - 10000);
    this.save();
  }

  listByUser(userId: string, limit = 200): ConversationEvent[] {
    return this.events.filter(e => e.userId === userId).slice(-limit);
  }
}

export const conversationStore = new ConversationStore();


