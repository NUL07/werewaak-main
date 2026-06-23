/**
 * SUPABASE SCHEMA & RLS POLICIES
 * 
 * Run this SQL in Supabase SQL Editor to create the tables and RLS policies.
 */

-- Create transfers table
CREATE TABLE transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('Sent', 'Received')),
  sender_name TEXT NOT NULL,
  sender_phone TEXT,
  sender_location TEXT,
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT,
  receiver_location TEXT,
  amount_sent NUMERIC NOT NULL,
  currency_sent TEXT NOT NULL,
  amount_received NUMERIC NOT NULL,
  currency_received TEXT NOT NULL,
  commission NUMERIC DEFAULT 0,
  commission_percent NUMERIC DEFAULT 0,
  date_time TIMESTAMP NOT NULL,
  entered_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create loans table
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  borrower_name TEXT NOT NULL,
  borrower_id_passport TEXT,
  borrower_phone TEXT,
  borrower_location TEXT,
  loan_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  interest_rate NUMERIC NOT NULL,
  interest_amount NUMERIC NOT NULL,
  total_repayable NUMERIC NOT NULL,
  date_issued DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Repaid')),
  entered_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own transfers and loans
CREATE POLICY "Users can view own transfers"
  ON transfers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transfers"
  ON transfers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transfers"
  ON transfers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transfers"
  ON transfers FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own loans"
  ON loans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own loans"
  ON loans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loans"
  ON loans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own loans"
  ON loans FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_transfers_user_id ON transfers(user_id);
CREATE INDEX idx_transfers_date_time ON transfers(date_time);
CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_loans_date_issued ON loans(date_issued);
