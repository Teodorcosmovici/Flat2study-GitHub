import { createClient } from '@supabase/supabase-js';
import feedData from '../public/spacest-feed.json';

const supabase = createClient(
  'https://txuptwgqziperdffnuqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4dXB0d2dxemlwZXJkZmZudXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNTEwNjUsImV4cCI6MjA3MTcyNzA2NX0.eaa_nD6O25SIaIyfOqw_38k2aA2-ysvXaoPSv3RW94A'
);

async function importFeed() {
  console.log('Starting feed import...');
  console.log(`Found ${feedData.length} listings in feed`);

  const { data, error } = await supabase.functions.invoke(
    'import-spacest-feed-direct',
    {
      body: { listings: feedData },
    }
  );

  if (error) {
    console.error('Import failed:', error);
    return;
  }

  console.log('Import complete:', data);
  console.log(`✅ Imported: ${data.imported}`);
  console.log(`🔄 Updated: ${data.updated}`);
  console.log(`⏭️  Skipped: ${data.skipped}`);
  console.log(`📊 Total processed: ${data.total}`);
}

importFeed();
