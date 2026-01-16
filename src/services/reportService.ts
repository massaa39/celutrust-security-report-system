import { supabase } from '../lib/supabase';
import { mockReportService } from './mockReportService';
import type { Report, ReportFormData } from '../types';

// モックモード判定（デモ用）
const DEMO_MODE = import.meta.env.VITE_SUPABASE_URL === 'https://demo.supabase.co';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

export const reportService = {
  async uploadPhoto(file: File): Promise<string> {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('ファイルサイズは5MB以下にしてください');
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error('JPEG、PNGファイルのみアップロード可能です');
    }

    if (DEMO_MODE) {
      // デモモード: Base64エンコードでLocalStorageに保存
      return mockReportService.uploadPhoto(file);
    }

    // 本番モード: Supabase Storageにアップロード
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `reports/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('report-photos')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('report-photos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  async createReport(
    userId: string,
    formData: ReportFormData,
    photoUrls: string[]
  ): Promise<Report> {
    if (DEMO_MODE) {
      // デモモード: LocalStorageに保存
      const report = await mockReportService.createReport(userId, {
        contract_name: formData.contract_name,
        guard_location: formData.guard_location,
        work_type: formData.work_type,
        work_detail: formData.work_detail || '',
        work_date_from: formData.work_date_from,
        work_date_to: formData.work_date_to,
        weather: formData.weather || null,
        break_time: formData.break_time || null,
        overtime_time: formData.overtime_time || null,
        assigned_guards: formData.assigned_guards || null,
        photo_urls: photoUrls,
        special_notes: formData.special_notes || 'なし',
        special_notes_detail: formData.special_notes_detail || null,
        traffic_guide_assigned: formData.traffic_guide_assigned,
        traffic_guide_assignee_name: formData.traffic_guide_assignee_name || null,
        misc_guard_assigned: formData.misc_guard_assigned,
        misc_guard_assignee_name: formData.misc_guard_assignee_name || null,
        remarks: formData.remarks || null,
      });
      return report as Report;
    }

    // 本番モード: Supabaseに保存
    const { data, error } = await supabase
      .from('reports')
      .insert({
        user_id: userId,
        contract_name: formData.contract_name,
        guard_location: formData.guard_location,
        work_type: formData.work_type,
        work_detail: formData.work_detail || null,
        work_date_from: formData.work_date_from,
        work_date_to: formData.work_date_to,
        weather: formData.weather || null,
        break_time: formData.break_time || null,
        overtime_time: formData.overtime_time || null,
        assigned_guards: formData.assigned_guards || null,
        photo_urls: photoUrls,
        special_notes: formData.special_notes || null,
        special_notes_detail: formData.special_notes_detail || null,
        traffic_guide_assigned: formData.traffic_guide_assigned,
        traffic_guide_assignee_name: formData.traffic_guide_assignee_name || null,
        misc_guard_assigned: formData.misc_guard_assigned,
        misc_guard_assignee_name: formData.misc_guard_assignee_name || null,
        remarks: formData.remarks || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'submit',
      report_id: data.id,
    });

    return data;
  },

  async getMyReports(userId: string): Promise<Report[]> {
    if (DEMO_MODE) {
      // デモモード: LocalStorageから取得
      const reports = await mockReportService.getUserReports(userId);
      return reports as Report[];
    }

    // 本番モード: Supabaseから取得
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  },

  async getAllReports(): Promise<Report[]> {
    if (DEMO_MODE) {
      // デモモード: LocalStorageから取得
      const reports = await mockReportService.getAllReports();
      return reports as Report[];
    }

    // 本番モード: Supabaseから取得
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  },

  async searchReports(filters: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    contractName?: string;
  }): Promise<Report[]> {
    if (DEMO_MODE) {
      // デモモード: LocalStorageから検索
      let reports = await mockReportService.getAllReports();

      if (filters.userId) {
        reports = reports.filter(r => r.user_id === filters.userId);
      }

      if (filters.contractName) {
        reports = reports.filter(r =>
          r.contract_name.toLowerCase().includes(filters.contractName!.toLowerCase())
        );
      }

      if (filters.startDate) {
        reports = reports.filter(r =>
          new Date(r.work_date_from) >= new Date(filters.startDate!)
        );
      }

      if (filters.endDate) {
        reports = reports.filter(r =>
          new Date(r.work_date_to) <= new Date(filters.endDate!)
        );
      }

      return reports as Report[];
    }

    // 本番モード: Supabaseで検索
    let query = supabase.from('reports').select('*');

    if (filters.startDate) {
      query = query.gte('work_date_from', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('work_date_to', filters.endDate);
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.contractName) {
      query = query.ilike('contract_name', `%${filters.contractName}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  },
};
