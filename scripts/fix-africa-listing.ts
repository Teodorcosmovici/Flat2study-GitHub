import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://txuptwgqziperdffnuqq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4dXB0d2dxemlwZXJkZmZudXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNTEwNjUsImV4cCI6MjA3MTcyNzA2NX0.eaa_nD6O25SIaIyfOqw_38k2aA2-ysvXaoPSv3RW94A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAfricaListing() {
  console.log('Updating listing location from Africa to Milan...');
  
  // Update the listing coordinates to Milan (Viale Antonio Canova area)
  const { data, error } = await supabase
    .from('listings')
    .update({ 
      lat: 45.4796, 
      lng: 9.2011 
    })
    .eq('id', '32f2bd8e-f6c8-4bd8-8718-4a734a61370e')
    .select('id, title, address_line, lat, lng');

  if (error) {
    console.error('Error updating listing:', error);
    return;
  }

  console.log('Successfully updated listing:', data);
}

fixAfricaListing();
