// Test script to verify image deduplication logic

// Simulate the deduplication function
function deduplicateImageUrls(imageUrls: string[]): string[] {
  if (imageUrls.length === 0) return [];
  
  // Group images by their base path (without size indicators)
  const groups = new Map<string, string[]>();
  
  for (const url of imageUrls) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      
      console.log(`\nProcessing: ${path}`);
      
      // Extract base filename by removing ALL size patterns
      const basePath = path
        .replace(/-\d+x\d+(?=\.jpeg)/gi, '') // Remove -150x150 before .jpeg
        .replace(/-scaled(?=\.jpeg)/gi, '')   // Remove -scaled before .jpeg  
        .replace(/\d+x\d+\.jpeg$/i, '.jpeg'); // Remove 800x600.jpeg -> .jpeg
      
      console.log(`  Base path: ${basePath}`);
      
      if (!groups.has(basePath)) {
        groups.set(basePath, []);
      }
      groups.get(basePath)!.push(url);
    } catch (e) {
      console.error(`  Error parsing URL: ${e}`);
      continue;
    }
  }
  
  console.log(`\n=== Groups formed: ${groups.size} ===`);
  
  // For each group, keep only the largest version
  const deduplicated: string[] = [];
  let totalDuplicates = 0;
  
  for (const [basePath, urlGroup] of groups.entries()) {
    console.log(`\nGroup: ${basePath.split('/').pop()}`);
    console.log(`  URLs in group: ${urlGroup.length}`);
    
    if (urlGroup.length === 1) {
      deduplicated.push(urlGroup[0]);
      console.log(`  ✓ Single URL, keeping it`);
      continue;
    }
    
    totalDuplicates += urlGroup.length - 1;
    
    // Sort by: 1) URLs without size indicators first, 2) then by length
    const sorted = urlGroup.sort((a, b) => {
      const aHasSize = /-\d+x\d+/.test(a) || /\d+x\d+\./.test(a) || /-scaled/.test(a);
      const bHasSize = /-\d+x\d+/.test(b) || /\d+x\d+\./.test(b) || /-scaled/.test(b);
      
      console.log(`  Comparing:`);
      console.log(`    A: ${a.split('/').pop()} (hasSize: ${aHasSize})`);
      console.log(`    B: ${b.split('/').pop()} (hasSize: ${bHasSize})`);
      
      if (aHasSize && !bHasSize) return 1;  // b comes first
      if (!aHasSize && bHasSize) return -1; // a comes first
      
      return b.length - a.length; // Longer URLs first
    });
    
    deduplicated.push(sorted[0]);
    console.log(`  ✓ Kept: ${sorted[0].split('/').pop()}`);
    console.log(`  ✗ Removed ${urlGroup.length - 1} duplicates:`);
    for (let i = 1; i < sorted.length; i++) {
      console.log(`    - ${sorted[i].split('/').pop()}`);
    }
  }
  
  console.log(`\n=== FINAL RESULT ===`);
  console.log(`Input: ${imageUrls.length} URLs`);
  console.log(`Output: ${deduplicated.length} unique images`);
  console.log(`Removed: ${totalDuplicates} duplicates`);
  
  return deduplicated;
}

// Test with realistic Spacest image URLs
const testUrls = [
  // Same image in 3 sizes
  'https://roomless-listing-images.s3.us-east-2.amazonaws.com/uploads/bedroom1.jpeg',
  'https://roomless-listing-images.s3.us-east-2.amazonaws.com/uploads/bedroom1-150x150.jpeg',
  'https://roomless-listing-images.s3.us-east-2.amazonaws.com/uploads/bedroom1-800x600.jpeg',
  
  // Another image with scaled version
  'https://roomless-listing-images.s3.us-east-2.amazonaws.com/uploads/kitchen.jpeg',
  'https://roomless-listing-images.s3.us-east-2.amazonaws.com/uploads/kitchen-scaled.jpeg',
  'https://roomless-listing-images.s3.us-east-2.amazonaws.com/uploads/kitchen-300x300.jpeg',
  
  // Image with size in different format
  'https://roomless-listing-images.s3.us-east-2.amazonaws.com/uploads/bathroom1.jpeg',
  'https://roomless-listing-images.s3.us-east-2.amazonaws.com/uploads/bathroom1-1024x768.jpeg',
  
  // Image with just WIDTHxHEIGHT format (no dash)
  'https://roomless-listing-images.s3.us-east-2.amazonaws.com/uploads/living-room-photo.jpeg',
  'https://roomless-listing-images.s3.us-east-2.amazonaws.com/uploads/living-room-photo-640x480.jpeg',
  
  // Unique image (no duplicates)
  'https://roomless-listing-images.s3.us-east-2.amazonaws.com/uploads/balcony.jpeg',
  
  // Edge case: image name contains numbers
  'https://roomless-listing-images.s3.us-east-2.amazonaws.com/uploads/room-123-view.jpeg',
  'https://roomless-listing-images.s3.us-east-2.amazonaws.com/uploads/room-123-view-150x150.jpeg',
];

console.log('='.repeat(60));
console.log('TESTING IMAGE DEDUPLICATION');
console.log('='.repeat(60));
console.log(`\nTest URLs: ${testUrls.length}`);

const result = deduplicateImageUrls(testUrls);

console.log('\n' + '='.repeat(60));
console.log('EXPECTED: 6 unique images');
console.log('ACTUAL: ' + result.length + ' unique images');
console.log('='.repeat(60));

console.log('\nFinal deduplicated URLs:');
result.forEach((url, i) => {
  console.log(`${i + 1}. ${url.split('/').pop()}`);
});
