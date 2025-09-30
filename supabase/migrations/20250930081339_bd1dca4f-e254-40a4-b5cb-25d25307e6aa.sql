-- Create RPC to fetch confirmed bookings enriched with tenant and listing info for a landlord
CREATE OR REPLACE FUNCTION public.get_confirmed_bookings_with_tenant(p_landlord_id uuid)
RETURNS TABLE(
  id uuid,
  listing_id uuid,
  tenant_id uuid,
  landlord_id uuid,
  status text,
  check_in_date date,
  check_out_date date,
  monthly_rent integer,
  security_deposit integer,
  total_amount integer,
  payment_authorization_id text,
  payment_status text,
  authorization_expires_at timestamptz,
  landlord_response_due_at timestamptz,
  landlord_response text,
  application_message text,
  application_document_url text,
  application_document_type text,
  created_at timestamptz,
  updated_at timestamptz,
  tenant_full_name text,
  tenant_email text,
  tenant_phone text,
  tenant_university text,
  listing_title text,
  listing_address_line text,
  listing_images jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.id, b.listing_id, b.tenant_id, b.landlord_id, b.status,
    b.check_in_date, b.check_out_date, b.monthly_rent, b.security_deposit, b.total_amount,
    b.payment_authorization_id, b.payment_status, b.authorization_expires_at,
    b.landlord_response_due_at, b.landlord_response,
    b.application_message, b.application_document_url, b.application_document_type,
    b.created_at, b.updated_at,
    p.full_name as tenant_full_name,
    p.email as tenant_email,
    p.phone as tenant_phone,
    p.university as tenant_university,
    l.title as listing_title,
    l.address_line as listing_address_line,
    l.images as listing_images
  FROM bookings b
  JOIN profiles p ON p.user_id = b.tenant_id
  JOIN listings l ON l.id = b.listing_id
  WHERE b.landlord_id = p_landlord_id
    AND b.status = 'confirmed'
    AND EXISTS (
      SELECT 1 FROM profiles lp
      WHERE lp.id = p_landlord_id
      AND lp.user_id = auth.uid()
      AND lp.user_type IN ('private','agency')
    )
  ORDER BY b.created_at DESC;
$$;