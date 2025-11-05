
-- Delete all existing Spacest listings to re-import with new criteria
DELETE FROM listings 
WHERE external_source = 'spacest';
