
-- Replace the first image in the Via Giuseppe Meda 36 listing
UPDATE listings 
SET images = jsonb_set(
  images, 
  '{0}', 
  '"https://04559df7-166d-44a9-9937-682f9e8f3d3e.lovableproject.com/images/meda-36-room-1.jpg"'
)
WHERE id = '8ab090d6-8d65-4c25-b83c-9c3bc06b7806';
