-- Update titles for bedspace listings to correctly show "Bedspace"
UPDATE listings 
SET title = REPLACE(title, 'Room in Shared Property', 'Bedspace in Shared Property')
WHERE type = 'bedspace' 
AND title LIKE '%Room in Shared Property%';