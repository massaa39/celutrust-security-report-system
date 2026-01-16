-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_name TEXT NOT NULL,
  guard_location TEXT NOT NULL,
  work_type TEXT NOT NULL,
  work_detail TEXT,
  work_date_from TIMESTAMPTZ NOT NULL,
  work_date_to TIMESTAMPTZ NOT NULL,
  photo_urls TEXT[] DEFAULT '{}',
  special_notes TEXT,
  traffic_guide_assigned BOOLEAN DEFAULT false,
  misc_guard_assigned BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('login', 'logout', 'submit', 'download')),
  report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_work_date_from ON reports(work_date_from DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports
-- Employees can read their own reports
CREATE POLICY "従業員は自分の報告書を参照可能"
  ON reports FOR SELECT
  USING (auth.uid() = user_id);

-- Employees can insert their own reports
CREATE POLICY "従業員は自分の報告書を作成可能"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all reports
CREATE POLICY "管理者は全報告書を参照可能"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Admins can update all reports
CREATE POLICY "管理者は全報告書を更新可能"
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for activity_logs
-- Users can read their own logs
CREATE POLICY "ユーザーは自分のログを参照可能"
  ON activity_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own logs
CREATE POLICY "ユーザーは自分のログを作成可能"
  ON activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all logs
CREATE POLICY "管理者は全ログを参照可能"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on reports
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
