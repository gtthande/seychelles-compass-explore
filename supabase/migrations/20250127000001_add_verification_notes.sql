-- Add verification_notes column to businesses table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'verification_notes'
  ) THEN
    ALTER TABLE businesses ADD COLUMN verification_notes TEXT NULL;
  END IF;
END$$;




