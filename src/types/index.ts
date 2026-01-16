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
  weather: string | null;
  break_time: string | null;
  overtime_time: string | null;
  assigned_guards: string | null;
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
  weather: string;
  break_time: string;
  overtime_time: string;
  assigned_guards: string;
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

// OCR解析関連の型定義
export interface OCRAnalysisResult {
  // 解析されたフォームデータ（ReportFormDataと完全互換）
  formData: ReportFormData;

  // 解析の信頼度スコア（動的算出、0.0-1.0）
  confidenceScore: number;

  // フィールドごとの信頼度（動的算出）
  fieldConfidence: {
    contract_name: number;
    guard_location: number;
    work_type: number;
    work_date_from: number;
    work_date_to: number;
    weather: number;
    break_time: number;
    overtime_time: number;
    assigned_guards: number;
    special_notes: number;
    traffic_guide_assigned: number;
    misc_guard_assigned: number;
    remarks: number;
  };

  // 元の画像URL（参照用）
  originalImageUrl: string;

  // Constitutional AI準拠確認（動的評価）
  constitutionalCompliance: {
    isCompliant: boolean;
    score: number;
    violations: string[];
  };

  // 解析メタデータ
  metadata: {
    analyzedAt: string;
    processingTimeMs: number;
    modelVersion: string;
  };
}

export interface OCRError {
  code: 'INVALID_IMAGE' | 'API_ERROR' | 'PARSE_ERROR' | 'VALIDATION_ERROR' | 'CONSTITUTIONAL_VIOLATION';
  message: string;
  details?: unknown;
}
