-- Deduplicate existing bookings created for the same payment authorization
WITH ranked AS (
  SELECT id, payment_authorization_id,
         ROW_NUMBER() OVER (PARTITION BY payment_authorization_id ORDER BY created_at) AS rn
  FROM bookings
  WHERE payment_authorization_id IS NOT NULL
)
DELETE FROM bookings b
USING ranked r
WHERE b.id = r.id AND r.rn > 1;

-- Enforce idempotency at the database level
CREATE UNIQUE INDEX IF NOT EXISTS bookings_payment_authorization_id_unique
ON bookings (payment_authorization_id)
WHERE payment_authorization_id IS NOT NULL;