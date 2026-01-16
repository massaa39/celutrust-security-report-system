import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { reportService } from '../services/reportService';
import { pdfService } from '../services/pdfService';
import type { Report } from '../types';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    startDate: '',
    endDate: '',
    contractName: '',
  });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadReports();
  }, [user]);

  const loadReports = async () => {
    try {
      setLoading(true);
      if (!user) return;

      let data: Report[];
      if (isAdmin) {
        data = await reportService.getAllReports();
      } else {
        data = await reportService.getMyReports(user.id);
      }
      setReports(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('報告書の読み込みに失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const data = await reportService.searchReports(searchFilters);
      setReports(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (report: Report) => {
    try {
      await pdfService.generateReportPDF(report, user?.email || '');
    } catch (err) {
      alert('PDF生成に失敗しました');
    }
  };

  const handleBatchDownloadPDF = async () => {
    try {
      const userNames = new Map<string, string>();
      reports.forEach(report => {
        userNames.set(report.user_id, user?.email || '不明');
      });
      await pdfService.generateBatchPDF(reports, userNames);
    } catch (err) {
      alert('一括PDF生成に失敗しました');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      alert('ログアウトに失敗しました');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && reports.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? '管理者ダッシュボード' : 'マイダッシュボード'}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-600 hover:text-slate-800"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* モバイル超特大ボタン：絶対に見逃せないデザイン */}
        <div className="mb-8 space-y-5">
          {/* 📷 写真で報告 - 超特大ボタン（モバイル専用デザイン） */}
          <button
            onClick={() => navigate('/report/from-photo')}
            className="w-full bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 text-white py-10 px-10 rounded-2xl hover:from-orange-600 hover:via-red-600 hover:to-pink-600 focus:outline-none focus:ring-8 focus:ring-orange-300 shadow-2xl font-black text-3xl flex flex-col items-center justify-center space-y-3 transition-all transform active:scale-95 animate-pulse md:py-8 md:flex-row md:space-y-0 md:space-x-4 md:text-2xl md:animate-none"
          >
            <span className="text-6xl md:text-5xl">📷</span>
            <div className="text-center md:text-left">
              <div>写真で報告</div>
              <div className="text-xl md:text-lg font-bold">(現地解散OK!)</div>
            </div>
          </button>

          {/* サブボタン群 - 控えめなデザイン */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/report/new')}
              className="w-full sm:w-auto bg-gray-600 text-white py-3 px-5 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm font-medium opacity-80"
            >
              📝 通常入力で作成
            </button>

            {isAdmin && reports.length > 0 && (
              <button
                onClick={handleBatchDownloadPDF}
                className="w-full sm:w-auto bg-gray-600 text-white py-3 px-5 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm font-medium opacity-80"
              >
                📄 一括PDF出力
              </button>
            )}
          </div>
        </div>

        {isAdmin && (
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h2 className="text-lg font-semibold mb-4">検索フィルター</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開始日
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm"
                  value={searchFilters.startDate}
                  onChange={(e) =>
                    setSearchFilters({ ...searchFilters, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  終了日
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm"
                  value={searchFilters.endDate}
                  onChange={(e) =>
                    setSearchFilters({ ...searchFilters, endDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  契約先
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm"
                  value={searchFilters.contractName}
                  onChange={(e) =>
                    setSearchFilters({ ...searchFilters, contractName: e.target.value })
                  }
                  placeholder="契約先名で検索"
                />
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <button
                onClick={handleSearch}
                className="bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                検索
              </button>
              <button
                onClick={loadReports}
                className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                リセット
              </button>
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">
              報告書一覧 ({reports.length}件)
            </h2>
          </div>

          {reports.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              報告書がありません
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      提出日時
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      契約先
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      警備場所
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      勤務日時
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      写真
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(report.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.contract_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.guard_location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(report.work_date_from)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.photo_urls.length}枚
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDownloadPDF(report)}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          PDF出力
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
