-- Migration V3: Add DELETE policy for responses table (required for reset feature)
-- Run this in Supabase SQL Editor

CREATE POLICY "Service role can delete" ON responses
  FOR DELETE TO service_role USING (true);
