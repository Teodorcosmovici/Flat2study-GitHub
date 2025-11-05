
-- Delete Spacest listings that don't meet the price criteria
DELETE FROM listings 
WHERE external_source = 'spacest'
AND status = 'DRAFT'
AND (
  (type = 'room' AND rent_monthly_eur >= 800) OR
  (type = 'studio' AND rent_monthly_eur >= 1100) OR
  (type = 'entire_property' AND rent_monthly_eur > (bedrooms * 900))
);

-- Publish the remaining valid Spacest listings
UPDATE listings 
SET status = 'PUBLISHED', 
    review_status = 'approved',
    published_at = NOW()
WHERE external_source = 'spacest'
AND status = 'DRAFT';
