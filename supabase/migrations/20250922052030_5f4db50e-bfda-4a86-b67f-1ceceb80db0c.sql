-- Update the get_platform_analytics function to count total registered users from auth.users
CREATE OR REPLACE FUNCTION public.get_platform_analytics(start_date date DEFAULT (CURRENT_DATE - '30 days'::interval), end_date date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result JSONB;
    total_page_views BIGINT;
    unique_visitors BIGINT;
    avg_time_per_page NUMERIC;
    total_registered_users BIGINT;
    listings_per_month JSONB;
    price_increases_count BIGINT;
    properties_taken_off_market BIGINT;
    most_viewed_listings JSONB;
    popular_pages JSONB;
BEGIN
    -- Total page views
    SELECT COUNT(*) INTO total_page_views 
    FROM page_views 
    WHERE created_at::date BETWEEN start_date AND end_date;
    
    -- Unique visitors (by session_id)
    SELECT COUNT(DISTINCT session_id) INTO unique_visitors 
    FROM page_views 
    WHERE created_at::date BETWEEN start_date AND end_date;
    
    -- Average time per page
    SELECT ROUND(AVG(time_spent_seconds), 2) INTO avg_time_per_page 
    FROM page_views 
    WHERE created_at::date BETWEEN start_date AND end_date;
    
    -- Total registered users from auth.users
    SELECT COUNT(*) INTO total_registered_users 
    FROM auth.users 
    WHERE email IS NOT NULL AND email_confirmed_at IS NOT NULL;
    
    -- Listings per month
    SELECT jsonb_agg(
        jsonb_build_object(
            'month', month_year,
            'count', listing_count
        )
    ) INTO listings_per_month
    FROM (
        SELECT 
            TO_CHAR(created_at, 'YYYY-MM') as month_year,
            COUNT(*) as listing_count
        FROM listings 
        WHERE created_at::date BETWEEN start_date AND end_date
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month_year
    ) monthly_listings;
    
    -- Price increases count
    SELECT COUNT(*) INTO price_increases_count 
    FROM listings 
    WHERE price_history IS NOT NULL 
    AND jsonb_array_length(price_history) > 0
    AND EXISTS (
        SELECT 1 FROM jsonb_array_elements(price_history) AS ph
        WHERE (ph->>'changed_at')::timestamp::date BETWEEN start_date AND end_date
        AND (ph->>'new_price')::integer > (ph->>'old_price')::integer
    );
    
    -- Properties taken off market
    SELECT COUNT(*) INTO properties_taken_off_market 
    FROM listings 
    WHERE status != 'PUBLISHED' 
    AND updated_at::date BETWEEN start_date AND end_date;
    
    -- Most viewed listings
    SELECT jsonb_agg(
        jsonb_build_object(
            'listing_id', listing_id,
            'title', title,
            'view_count', view_count
        )
    ) INTO most_viewed_listings
    FROM (
        SELECT 
            lv.listing_id,
            l.title,
            COUNT(*) as view_count
        FROM listing_views lv
        JOIN listings l ON l.id = lv.listing_id
        WHERE lv.created_at::date BETWEEN start_date AND end_date
        GROUP BY lv.listing_id, l.title
        ORDER BY view_count DESC
        LIMIT 10
    ) top_listings;
    
    -- Popular pages
    SELECT jsonb_agg(
        jsonb_build_object(
            'page', page_path,
            'views', view_count,
            'avg_time', avg_time
        )
    ) INTO popular_pages
    FROM (
        SELECT 
            page_path,
            COUNT(*) as view_count,
            ROUND(AVG(time_spent_seconds), 2) as avg_time
        FROM page_views
        WHERE created_at::date BETWEEN start_date AND end_date
        GROUP BY page_path
        ORDER BY view_count DESC
        LIMIT 10
    ) popular_pages_data;
    
    -- Build final result
    result := jsonb_build_object(
        'total_page_views', COALESCE(total_page_views, 0),
        'unique_visitors', COALESCE(unique_visitors, 0),
        'avg_time_per_page', COALESCE(avg_time_per_page, 0),
        'total_registered_users', COALESCE(total_registered_users, 0),
        'listings_per_month', COALESCE(listings_per_month, '[]'::jsonb),
        'price_increases_count', COALESCE(price_increases_count, 0),
        'properties_taken_off_market', COALESCE(properties_taken_off_market, 0),
        'most_viewed_listings', COALESCE(most_viewed_listings, '[]'::jsonb),
        'popular_pages', COALESCE(popular_pages, '[]'::jsonb)
    );
    
    RETURN result;
END;
$function$;