export interface User {
  id: string;
  email: string;
  role: 'employee' | 'admin';
  created_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  contract_name: string;
  guard_location: string;
  work_type: string;
  work_detail: string | null;
  work_date_from: string;
  work_date_to: string;
  photo_urls: string[];
  special_notes: string | null;
  special_notes_detail: string | null;
  traffic_guide_assigned: boolean;
  traffic_guide_assignee_name: string | null;
  misc_guard_assigned: boolean;
  misc_guard_assignee_name: string | null;
  remarks: string | null;
  status: 'submitted' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: 'login' | 'logout' | 'submit' | 'download';
  report_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface ReportFormData {
  contract_name: string;
  guard_location: string;
  work_type: string;
  work_detail: string;
  work_date_from: string;
  work_date_to: string;
  special_notes: string;
  special_notes_detail: string;
  traffic_guide_assigned: boolean;
  traffic_guide_assignee_name: string;
  misc_guard_assigned: boolean;
  misc_guard_assignee_name: string;
  remarks: string;
}

export const WORK_TYPES = {
  ROAD_TRAFFIC: '道路工事に於ける交通誘導',
  CONSTRUCTION_TRAFFIC: '建設工事現場に於ける交通誘導',
  VEHICLE_ENTRY: '工事関係車両の出入口に伴う交通誘導',
  EVENT_TRAFFIC: 'イベントに伴う交通誘導',
  PARKING_TRAFFIC: '駐車場の出入りに伴う交通誘導',
  CROWD_CONTROL: '人の雑踏する場所に於ける負傷者等の事故発生を警戒・防止業務',
} as const;

export type WorkType = keyof typeof WORK_TYPES;
