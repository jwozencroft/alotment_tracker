export interface User {
  id: number;
  username: string;
  security_question: string;
}

export interface Bed {
  id: string;
  name: string;
  description: string;
  notes: string;
  image_url: string | null;
  tasks?: BedTask[];
  logs?: BedProgressLog[];
}

export interface BedTask {
  id: string;
  bed_id: string;
  text: string;
  date: string;
  completed: boolean;
}

export interface BedProgressLog {
  id: string;
  bed_id: string;
  date: string;
  note: string;
  image_url: string | null;
}

export interface CropLog {
  id: string;
  planting_id: string;
  date: string;
  type: 'sow' | 'feed' | 'transplant' | 'harvest' | 'finish' | 'checkup';
  note: string;
  image_url: string | null;
  fertilizer?: string | null;
  location?: string | null;
}

export interface Planting {
  id: string;
  name: string;
  variety: string;
  family: string;
  seed_id: string | null;
  location: string; // bed_id or 'Seed Trays' or 'Greenhouse'
  harvest_date: string | null;
  status: 'Sown' | 'Growing' | 'Harvesting' | 'Finished';
  logs: CropLog[];
}

export interface Seed {
  id: string;
  type: string;
  variety: string;
  family: string;
  months: number[]; // Array of month indices 0-11
  qty: string;
  seed_type_option: string; // 'Heirloom' | 'Hybrid (F1)' | 'Open-pollinated' | 'Organic' | 'GMO' | ''
  germinate: string;
  maturity: number | null; // Days to maturity
  depth: string;
  light: string;
  expiry: string;
  zone: string;
  disease: string;
  nongmo: boolean;
  url: string;
  notes: string;
  image_url: string | null;
}

export interface Journal {
  id: string;
  title: string;
  date: string;
  notes: string;
  image_url: string | null;
}

export interface KnowledgeBaseItem {
  id: string;
  title: string;
  content: string;
  date: string;
  source: 'user' | 'ai';
  file_url: string | null;
  file_name: string | null;
}

export interface BedPlan {
  id: string;
  bed_id: string;
  year: number;
  grid: (string | null)[]; // Array of 16 cells
  notes: string;
  image_url: string | null;
}

export interface SyncEvent {
  type: 'MUTATION';
  table: 'beds' | 'plantings' | 'seeds' | 'journals' | 'knowledge_base' | 'bed_plans' | 'bed_tasks' | 'bed_progress_logs' | 'crop_logs' | 'dashboard_notes';
  action: 'create' | 'update' | 'delete';
  id?: string;
  user: string;
  timestamp: number;
}

export interface WeatherData {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
  source?: string;
  sourceUrl?: string;
  license?: string;
  location?: string;
}
