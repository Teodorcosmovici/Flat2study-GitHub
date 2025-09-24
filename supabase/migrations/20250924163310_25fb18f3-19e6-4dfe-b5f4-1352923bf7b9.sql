-- Update payment_status check constraint to include new status
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_payment_status_check;

ALTER TABLE bookings 
ADD CONSTRAINT bookings_payment_status_check 
CHECK (payment_status IN ('pending', 'authorized', 'captured', 'cancelled', 'failed', 'approved_awaiting_capture'));

-- Update status check constraint to include new status  
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings
ADD CONSTRAINT bookings_status_check
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'pending_payment', 'pending_landlord_response', 'approved_awaiting_payment'));