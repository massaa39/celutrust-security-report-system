import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { reportService } from '../services/reportService';
import { reportSchema } from '../validation/reportSchema';
import { WORK_TYPES } from '../types';

export function ReportForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    contract_name: '',
    guard_location: '',
    work_type: '',
    work_detail: '',
    work_date_from: '',
    work_date_to: '',
    special_notes: '',
    special_notes_detail: '',
    traffic_guide_assigned: false,
    traffic_guide_assignee_name: '',
    misc_guard_assigned: false,
    misc_guard_assignee_name: '',
    remarks: '',
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setUploadProgress(0);

    try {
      if (!user) {
        throw new Error('ユーザー情報が取得できません');
      }

      const validated = reportSchema.parse(formData);

      const photoUrls: string[] = [];
      
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const url = await reportService.uploadPhoto(file);
          photoUrls.push(url);
          setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
        }
      }

      await reportService.createReport(user.id, validated, photoUrls);

      alert('報告書を送信しました');
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('報告書の送信に失敗しました');
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            警備報告書作成
          </h1>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="contract_name"
                className="block text-sm font-medium text-gray-700"
              >
                契約先 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="contract_name"
                name="contract_name"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={formData.contract_name}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="guard_location"
                className="block text-sm font-medium text-gray-700"
              >
                警備場所 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="guard_location"
                name="guard_location"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={formData.guard_location}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="work_date_from"
                  className="block text-sm font-medium text-gray-700"
                >
                  勤務開始 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="work_date_from"
                  name="work_date_from"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={formData.work_date_from}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor="work_date_to"
                  className="block text-sm font-medium text-gray-700"
                >
                  勤務終了 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="work_date_to"
                  name="work_date_to"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={formData.work_date_to}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="work_type"
                className="block text-sm font-medium text-gray-700"
              >
                業務内容 <span className="text-red-500">*</span>
              </label>
              <select
                id="work_type"
                name="work_type"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={formData.work_type}
                onChange={handleInputChange}
                disabled={loading}
              >
                <option value="">選択してください</option>
                {Object.entries(WORK_TYPES).map(([key, value]) => (
                  <option key={key} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="work_detail"
                className="block text-sm font-medium text-gray-700"
              >
                担当業務詳細
              </label>
              <textarea
                id="work_detail"
                name="work_detail"
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={formData.work_detail}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                写真アップロード（最大5MB/枚）
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                multiple
                onChange={handleFileChange}
                disabled={loading}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {selectedFiles.length > 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  {selectedFiles.length}枚選択済み
                </p>
              )}
              {uploadProgress > 0 && (
                <div className="mt-2">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    アップロード中: {uploadProgress}%
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                特記事項
              </label>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="special_notes"
                      value="no"
                      checked={formData.special_notes === 'no' || formData.special_notes === ''}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-900">なし</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="special_notes"
                      value="yes"
                      checked={formData.special_notes === 'yes'}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-900">あり</span>
                  </label>
                </div>
                {formData.special_notes === 'yes' && (
                  <div>
                    <label
                      htmlFor="special_notes_detail"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      特記事項の内容
                    </label>
                    <textarea
                      id="special_notes_detail"
                      name="special_notes_detail"
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.special_notes_detail}
                      onChange={handleInputChange}
                      disabled={loading}
                      placeholder="特記事項の詳細を入力してください"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="traffic_guide_assigned"
                    name="traffic_guide_assigned"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formData.traffic_guide_assigned}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  <label
                    htmlFor="traffic_guide_assigned"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    交通誘導検定合格者配置
                  </label>
                </div>
                {formData.traffic_guide_assigned && (
                  <div className="mt-2 ml-6">
                    <label
                      htmlFor="traffic_guide_assignee_name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      検定合格者氏名
                    </label>
                    <input
                      type="text"
                      id="traffic_guide_assignee_name"
                      name="traffic_guide_assignee_name"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.traffic_guide_assignee_name}
                      onChange={handleInputChange}
                      disabled={loading}
                      placeholder="氏名を入力してください"
                    />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="misc_guard_assigned"
                    name="misc_guard_assigned"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formData.misc_guard_assigned}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  <label
                    htmlFor="misc_guard_assigned"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    雑踏警備検定合格者配置
                  </label>
                </div>
                {formData.misc_guard_assigned && (
                  <div className="mt-2 ml-6">
                    <label
                      htmlFor="misc_guard_assignee_name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      検定合格者氏名
                    </label>
                    <input
                      type="text"
                      id="misc_guard_assignee_name"
                      name="misc_guard_assignee_name"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.misc_guard_assignee_name}
                      onChange={handleInputChange}
                      disabled={loading}
                      placeholder="氏名を入力してください"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="remarks"
                className="block text-sm font-medium text-gray-700"
              >
                備考
              </label>
              <textarea
                id="remarks"
                name="remarks"
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={formData.remarks}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="備考があれば入力してください"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '送信中...' : '報告書を送信'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
