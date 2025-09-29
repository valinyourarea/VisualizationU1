export interface ETLNode {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  error?: string;
  dependencies: string[];
}

export interface ETLDag {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  nodes: ETLNode[];
  startTime?: Date;
  endTime?: Date;
  currentNode?: string;
}

export interface User {
  user_id: string;
  age: number;
  country: string;
  subscription_type: string;
  registration_date: string;
  total_watch_hours: number;
}

export interface Session {
  session_id: string;
  user_id: string;
  content_id: string;
  device_type: string;
  quality: string;
  watch_date: string;
  duration_minutes: number;
  completion_percentage: number;
}

export interface Analytics {
  totalUsers: number;
  totalSessions: number;
  avgWatchTime: number;
  avgCompletionRate: number;
  topContent: ContentMetric[];
  deviceDistribution: DeviceMetric[];
  subscriptionDistribution: SubscriptionMetric[];
}

export interface ContentMetric {
  content_id: string;
  views: number;
  avgCompletion: number;
}

export interface DeviceMetric {
  device: string;
  count: number;
  percentage: number;
}

export interface SubscriptionMetric {
  type: string;
  count: number;
  revenue: number;
}