export interface BusinessProcess {
  id: string;
  order: number;
  name: string;
  description: string;
  trigger: string;
  action: string;
  status: 'active' | 'inactive' | 'pending';
}

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'inactive';
  processes: BusinessProcess[];
  lastRun?: string;
  runsCount: number;
}
