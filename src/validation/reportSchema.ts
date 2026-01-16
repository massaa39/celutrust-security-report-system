import { z } from 'zod';

export const reportSchema = z.object({
  contract_name: z
    .string()
    .min(1, '契約先を入力してください')
    .max(200, '契約先は200文字以内で入力してください'),
  
  guard_location: z
    .string()
    .min(1, '警備場所を入力してください')
    .max(300, '警備場所は300文字以内で入力してください'),
  
  work_type: z
    .string()
    .min(1, '業務内容を選択してください'),
  
  work_detail: z
    .string()
    .max(1000, '担当業務詳細は1000文字以内で入力してください')
    .default(''),

  work_date_from: z
    .string()
    .min(1, '勤務開始日時を入力してください')
    .refine((val) => !isNaN(Date.parse(val)), '有効な日時を入力してください'),

  work_date_to: z
    .string()
    .min(1, '勤務終了日時を入力してください')
    .refine((val) => !isNaN(Date.parse(val)), '有効な日時を入力してください'),

  weather: z
    .string()
    .max(20, '天気は20文字以内で入力してください')
    .default(''),

  break_time: z
    .string()
    .max(20, '休憩時間は20文字以内で入力してください')
    .default(''),

  overtime_time: z
    .string()
    .max(20, '残業時間は20文字以内で入力してください')
    .default(''),

  assigned_guards: z
    .string()
    .max(500, '担当警備員は500文字以内で入力してください')
    .default(''),
  
  special_notes: z
    .string()
    .max(10, '特記事項の選択は10文字以内で入力してください')
    .default(''),
  
  special_notes_detail: z
    .string()
    .max(2000, '特記事項の内容は2000文字以内で入力してください')
    .default(''),
  
  traffic_guide_assigned: z.boolean(),
  
  traffic_guide_assignee_name: z
    .string()
    .max(100, '検定合格者氏名は100文字以内で入力してください')
    .default(''),
  
  misc_guard_assigned: z.boolean(),
  
  misc_guard_assignee_name: z
    .string()
    .max(100, '検定合格者氏名は100文字以内で入力してください')
    .default(''),
  
  remarks: z
    .string()
    .max(2000, '備考は2000文字以内で入力してください')
    .default(''),
}).refine(
  (data) => {
    const from = new Date(data.work_date_from);
    const to = new Date(data.work_date_to);
    return to > from;
  },
  {
    message: '勤務終了日時は勤務開始日時より後である必要があります',
    path: ['work_date_to'],
  }
);

export type ReportFormData = z.infer<typeof reportSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください'),
  
  password: z
    .string()
    .min(6, 'パスワードは6文字以上で入力してください')
    .max(100, 'パスワードは100文字以内で入力してください'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
