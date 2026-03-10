-- Soft delete columns for data screening
-- Migration v4: Add exclude/restore functionality for outlier management

-- Add soft delete columns
ALTER TABLE responses ADD COLUMN IF NOT EXISTS excluded BOOLEAN DEFAULT false;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS excluded_reason TEXT;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS excluded_at TIMESTAMPTZ;

-- Index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_responses_excluded ON responses(excluded);

-- Backfill existing rows (ensure no NULLs)
UPDATE responses SET excluded = false WHERE excluded IS NULL;

-- Verify migration
SELECT
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE excluded = true) as excluded_count,
    COUNT(*) FILTER (WHERE excluded = false OR excluded IS NULL) as active_count
FROM responses;
