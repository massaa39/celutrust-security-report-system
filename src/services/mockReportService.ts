/**
 * モック報告書サービス（デモ用）
 * 本番環境では実際のSupabaseを使用してください
 */

export interface MockReport {
  id: string;
  user_id: string;
  contract_name: string;
  guard_location: string;
  work_type: string;
  work_detail: string;
  work_date_from: string;
  work_date_to: string;
  weather: string | null;
  break_time: string | null;
  overtime_time: string | null;
  assigned_guards: string | null;
  photo_urls: string[];
  special_notes: string;
  special_notes_detail: string | null;
  traffic_guide_assigned: boolean;
  traffic_guide_assignee_name: string | null;
  misc_guard_assigned: boolean;
  misc_guard_assignee_name: string | null;
  remarks: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const REPORTS_KEY = 'mock_reports';

// UUIDの簡易生成
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// LocalStorageから報告書データを取得
function getReports(): MockReport[] {
  const data = localStorage.getItem(REPORTS_KEY);
  return data ? JSON.parse(data) : [];
}

// LocalStorageに報告書データを保存
function saveReports(reports: MockReport[]): void {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

export const mockReportService = {
  // 全報告書取得
  getAllReports: async (): Promise<MockReport[]> => {
    const reports = getReports();
    // created_atで降順ソート
    return reports.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  // ユーザーの報告書取得
  getUserReports: async (userId: string): Promise<MockReport[]> => {
    const reports = getReports();
    return reports
      .filter(r => r.user_id === userId)
      .sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  },

  // 報告書作成
  createReport: async (
    userId: string,
    reportData: Omit<MockReport, 'id' | 'user_id' | 'status' | 'created_at' | 'updated_at'>
  ): Promise<MockReport> => {
    const reports = getReports();
    const now = new Date().toISOString();

    const newReport: MockReport = {
      id: generateUUID(),
      user_id: userId,
      status: 'submitted',
      created_at: now,
      updated_at: now,
      ...reportData,
    };

    reports.push(newReport);
    saveReports(reports);

    // アクティビティログ
    const logs = JSON.parse(localStorage.getItem('mock_activity_logs') || '[]');
    logs.push({
      id: generateUUID(),
      user_id: userId,
      action: 'create_report',
      resource_type: 'report',
      resource_id: newReport.id,
      created_at: now,
    });
    localStorage.setItem('mock_activity_logs', JSON.stringify(logs));

    return newReport;
  },

  // 写真アップロード（Base64エンコード）
  uploadPhoto: async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64String = reader.result as string;
        // LocalStorageにBase64画像を保存
        const photoId = generateUUID();
        const photos = JSON.parse(localStorage.getItem('mock_photos') || '{}');
        photos[photoId] = {
          id: photoId,
          data: base64String,
          filename: file.name,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem('mock_photos', JSON.stringify(photos));

        // URLとしてphotoIdを返す
        resolve(`mock://photo/${photoId}`);
      };

      reader.onerror = () => {
        reject(new Error('ファイルの読み込みに失敗しました'));
      };

      reader.readAsDataURL(file);
    });
  },

  // 写真取得（Base64データを返す）
  getPhotoUrl: (photoUrl: string): string => {
    if (!photoUrl.startsWith('mock://photo/')) {
      return photoUrl; // 実際のURLの場合はそのまま返す
    }

    const photoId = photoUrl.replace('mock://photo/', '');
    const photos = JSON.parse(localStorage.getItem('mock_photos') || '{}');
    const photo = photos[photoId];

    return photo ? photo.data : '';
  },

  // サンプルデータ作成（デモ用）
  createSampleData: (userId: string): void => {
    const reports = getReports();

    // サンプルデータが既に存在する場合はスキップ
    if (reports.length > 0) {
      return;
    }

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const sampleReports: MockReport[] = [
      {
        id: generateUUID(),
        user_id: userId,
        contract_name: '積水ハウス建設事務所(株) 御中',
        guard_location: '大阪市都島区星陵ビル7m',
        work_type: '交通誘導警備業務',
        work_detail: '施設 工受',
        work_date_from: yesterday.toISOString(),
        work_date_to: new Date(yesterday.getTime() + 8 * 60 * 60 * 1000).toISOString(),
        weather: '晴れ',
        break_time: '1時間',
        overtime_time: null,
        assigned_guards: '山田 太郎\n佐藤 次郎',
        photo_urls: [],
        special_notes: 'なし',
        special_notes_detail: null,
        traffic_guide_assigned: true,
        traffic_guide_assignee_name: '山田 太郎',
        misc_guard_assigned: false,
        misc_guard_assignee_name: null,
        remarks: '特に問題なし',
        status: 'submitted',
        created_at: yesterday.toISOString(),
        updated_at: yesterday.toISOString(),
      },
      {
        id: generateUUID(),
        user_id: userId,
        contract_name: 'セリュートラスト株式会社 御中',
        guard_location: '兵庫県明石市大久保町駅前二丁目',
        work_type: '施設警備業務',
        work_detail: '巡回 施設',
        work_date_from: now.toISOString(),
        work_date_to: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString(),
        weather: '曇り',
        break_time: '30分',
        overtime_time: '2時間',
        assigned_guards: '佐藤 花子',
        photo_urls: [],
        special_notes: 'あり',
        special_notes_detail: '不審者を発見し、警察へ通報しました。',
        traffic_guide_assigned: false,
        traffic_guide_assignee_name: null,
        misc_guard_assigned: true,
        misc_guard_assignee_name: '佐藤 花子',
        remarks: '警察到着まで監視を継続',
        status: 'submitted',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
    ];

    saveReports(sampleReports);
    console.log('サンプル報告書データを作成しました（2件）');
  },
};
