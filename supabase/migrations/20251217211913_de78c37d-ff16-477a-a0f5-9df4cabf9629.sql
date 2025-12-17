-- Add property manager fee column to listings table
ALTER TABLE public.listings 
ADD COLUMN property_manager_fee_eur integer;

-- Set the fee for the specific listing
UPDATE public.listings 
SET property_manager_fee_eur = 528 
WHERE id = '9e33584e-25a6-4af9-bbc8-d24569f0e376';