-- Delist all properties outside Milan area
-- Milan area defined as: lat 45.26-45.66, lng 9.00-9.38 (approximately 40km radius)

UPDATE listings 
SET status = 'DRAFT',
    updated_at = now()
WHERE status = 'PUBLISHED' 
AND (lat < 45.26 OR lat > 45.66 OR lng < 9.00 OR lng > 9.38);