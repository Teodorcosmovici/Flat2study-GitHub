-- Publish all approved Spacest listings that are still in DRAFT
UPDATE listings
SET 
  status = 'PUBLISHED',
  published_at = NOW()
WHERE 
  external_source = 'spacest'
  AND review_status = 'approved'
  AND status = 'DRAFT';