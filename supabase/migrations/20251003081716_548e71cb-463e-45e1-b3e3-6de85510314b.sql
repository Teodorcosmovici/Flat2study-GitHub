-- Fix the first image URL for Via Giuseppe Meda 36 listing
UPDATE listings 
SET images = jsonb_set(
  images, 
  '{0}', 
'"/images/meda-36-room-1.jpg"'
)
WHERE id = '8ab090d6-8d65-4c25-b83c-9c3bc06b7806';