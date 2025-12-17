-- Add segments_time_data column for media (video/audio) analytics
-- This tracks time spent in each segment (0-9) like pages_time_data does for documents

ALTER TABLE access_logs
ADD COLUMN IF NOT EXISTS segments_time_data JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN access_logs.segments_time_data IS 'JSON object tracking time spent in each 10% segment (0-9) for media files. Format: {"0": 2.5, "1": 1.8, ...} where key is segment index and value is seconds watched in that segment.';
