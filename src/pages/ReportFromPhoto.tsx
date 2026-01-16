import { useState, useRef } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ocrService } from '../services/ocrService';
import { reportService } from '../services/reportService';
import { reportSchema } from '../validation/reportSchema';
import type { OCRAnalysisResult } from '../types';

/**
 * 写真で報告ページ - 高齢者向け簡易UI
 *
 * 設計思想:
 * - 大きなボタン（タップしやすい）
 * - シンプルな2-3ステップ
 * - 視認性の高いフォント・色使い
 * - エラーメッセージは親切に
 */

export function ReportFromPhoto() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'analyzing' | 'confirm' | 'submitting'>('upload');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [ocrResult, setOcrResult] = useState<OCRAnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<any>(null);

  // カメラ起動 or ファイル選択
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  // 写真解析開始
  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('写真を選択してください');
      return;
    }

    setStep('analyzing');
    setError('');

    try {
      const result = await ocrService.analyzeReport(selectedImage);
      setOcrResult(result);
      setFormData(result.formData);
      setStep('confirm');
    } catch (err: any) {
      setError(err.message || '写真の解析に失敗しました');
      setStep('upload');
    }
  };

  // フォーム修正
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev: any) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  // 報告書送信
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('ユーザー情報が取得できません');
      return;
    }

    setStep('submitting');
    setError('');

    try {
      const validated = reportSchema.parse(formData);
      await reportService.createReport(user.id, validated, []);

      alert('報告書を送信しました！\n\n現地解散できます。お疲れ様でした！');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || '報告書の送信に失敗しました');
      setStep('confirm');
    }
  };

  // ステップ1: 写真アップロード
  if (step === 'upload') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ヘッダー */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">写真で報告</h1>
            <p className="text-lg text-gray-600">紙の報告書を撮影するだけで自動入力</p>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
              <p className="text-lg text-red-800 font-medium">{error}</p>
            </div>
          )}

          {/* 写真プレビュー */}
          {imagePreview && (
            <div className="mb-6">
              <img
                src={imagePreview}
                alt="選択された写真"
                className="w-full max-h-96 object-contain rounded-lg border-4 border-emerald-200"
              />
            </div>
          )}

          {/* 写真選択ボタン（大きい） */}
          <div className="space-y-6">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              capture="environment"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 px-6 bg-emerald-600 text-white text-2xl font-bold rounded-xl hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500 shadow-lg transition-all"
            >
              📷 写真を撮る / 選択する
            </button>

            {selectedImage && (
              <button
                type="button"
                onClick={handleAnalyze}
                className="w-full py-8 px-6 bg-slate-700 text-white text-2xl font-bold rounded-xl hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-500 shadow-lg transition-all"
              >
                🔍 自動入力を開始
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 px-6 bg-gray-200 text-gray-700 text-xl font-medium rounded-xl hover:bg-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-400 transition-all"
            >
              ← 戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ステップ2: 解析中
  if (step === 'analyzing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-24 w-24 border-8 border-emerald-200 border-t-emerald-600 mb-6"></div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">写真を解析中...</h2>
          <p className="text-xl text-gray-600">少々お待ちください（30秒程度）</p>
        </div>
      </div>
    );
  }

  // ステップ3: 確認・修正
  if (step === 'confirm' && ocrResult && formData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">内容を確認してください</h1>
            <p className="text-lg text-gray-600">
              信頼度: <span className="font-bold text-emerald-600">{Math.round(ocrResult.confidenceScore * 100)}%</span>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
              <p className="text-lg text-red-800 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md">
            {/* 契約先 */}
            <div>
              <label className="block text-lg font-medium text-gray-900 mb-2">契約先 *</label>
              <input
                type="text"
                name="contract_name"
                value={formData.contract_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-md focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            {/* 警備場所 */}
            <div>
              <label className="block text-lg font-medium text-gray-900 mb-2">警備場所 *</label>
              <input
                type="text"
                name="guard_location"
                value={formData.guard_location}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-md focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            {/* 勤務時間 */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-lg font-medium text-gray-900 mb-2">勤務開始 *</label>
                <input
                  type="datetime-local"
                  name="work_date_from"
                  value={formData.work_date_from}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-md focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-900 mb-2">勤務終了 *</label>
                <input
                  type="datetime-local"
                  name="work_date_to"
                  value={formData.work_date_to}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-md focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>

            {/* 天気・休憩・残業 */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label className="block text-lg font-medium text-gray-900 mb-2">天気</label>
                <input
                  type="text"
                  name="weather"
                  value={formData.weather}
                  onChange={handleInputChange}
                  placeholder="晴れ"
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-md focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-900 mb-2">休憩時間</label>
                <input
                  type="text"
                  name="break_time"
                  value={formData.break_time}
                  onChange={handleInputChange}
                  placeholder="1時間"
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-md focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-900 mb-2">残業時間</label>
                <input
                  type="text"
                  name="overtime_time"
                  value={formData.overtime_time}
                  onChange={handleInputChange}
                  placeholder="2時間"
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-md focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>

            {/* 担当警備員 */}
            <div>
              <label className="block text-lg font-medium text-gray-900 mb-2">担当警備員</label>
              <textarea
                name="assigned_guards"
                value={formData.assigned_guards}
                onChange={handleInputChange}
                rows={3}
                placeholder="山田 太郎&#10;佐藤 次郎"
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-md focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            {/* 備考 */}
            <div>
              <label className="block text-lg font-medium text-gray-900 mb-2">備考</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-md focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            {/* 送信ボタン */}
            <div className="space-y-4">
              <button
                type="submit"
                className="w-full py-6 px-6 bg-emerald-600 text-white text-2xl font-bold rounded-xl hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500 shadow-lg transition-all"
              >
                ✅ 報告書を送信
              </button>

              <button
                type="button"
                onClick={() => setStep('upload')}
                className="w-full py-4 px-6 bg-gray-200 text-gray-700 text-xl font-medium rounded-xl hover:bg-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-400 transition-all"
              >
                ← 写真を撮り直す
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ステップ4: 送信中
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-24 w-24 border-8 border-emerald-200 border-t-emerald-600 mb-6"></div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">報告書を送信中...</h2>
        <p className="text-xl text-gray-600">少々お待ちください</p>
      </div>
    </div>
  );
}
