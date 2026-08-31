-- Drop abandoned marketing/outreach ghost tables
DROP TABLE IF EXISTS campaign_contacts CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS sequence_enrollments CASCADE;
DROP TABLE IF EXISTS sequence_steps CASCADE;
DROP TABLE IF EXISTS sequences CASCADE;
DROP TABLE IF EXISTS instagram_sends CASCADE;
DROP TABLE IF EXISTS linkedin_sends CASCADE;
DROP TABLE IF EXISTS whatsapp_sends CASCADE;

-- Drop obsolete diagnostic and storage analysis tables
DROP TABLE IF EXISTS animation_errors CASCADE;
DROP TABLE IF EXISTS storage_analysis_results CASCADE;
DROP TABLE IF EXISTS storage_change_logs CASCADE;
DROP TABLE IF EXISTS duplicate_skips CASCADE;
