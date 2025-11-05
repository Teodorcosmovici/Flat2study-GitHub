
-- Delete Spacest listings that don't meet the price criteria
-- Rooms >= €800, Studios >= €1100, 2-bed >= €1800, 3-bed >= €2500, 4+ bed apartments

DELETE FROM listings 
WHERE external_source = 'spacest'
AND status != 'ARCHIVED'
AND (
  (type = 'room' AND rent_monthly_eur >= 800) OR
  (type = 'studio' AND rent_monthly_eur >= 1100) OR
  (type IN ('entire_property', 'apartment') AND bedrooms = 2 AND rent_monthly_eur >= 1800) OR
  (type IN ('entire_property', 'apartment') AND bedrooms = 3 AND rent_monthly_eur >= 2500) OR
  (type IN ('entire_property', 'apartment') AND bedrooms >= 4)
);
