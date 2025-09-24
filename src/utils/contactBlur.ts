// Utility function to blur sensitive contact information
export const blurContactInfo = (text: string | null | undefined): string => {
  if (!text) return '';
  
  // Blur phone numbers (various formats)
  const phoneRegex = /(\+?\d{1,4}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
  
  // Blur email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  
  let blurred = text;
  
  // Replace phone numbers with blurred version
  blurred = blurred.replace(phoneRegex, (match) => {
    if (match.length <= 4) return match; // Don't blur very short numbers
    const firstTwo = match.substring(0, 2);
    const lastTwo = match.substring(match.length - 2);
    const middle = '*'.repeat(Math.max(match.length - 4, 3));
    return `${firstTwo}${middle}${lastTwo}`;
  });
  
  // Replace email addresses with blurred version
  blurred = blurred.replace(emailRegex, (match) => {
    const [localPart, domain] = match.split('@');
    const blurredLocal = localPart.length > 2 
      ? `${localPart[0]}${'*'.repeat(localPart.length - 2)}${localPart[localPart.length - 1]}`
      : localPart;
    const [domainName, tld] = domain.split('.');
    const blurredDomain = domainName.length > 2
      ? `${domainName[0]}${'*'.repeat(domainName.length - 2)}${domainName[domainName.length - 1]}`
      : domainName;
    return `${blurredLocal}@${blurredDomain}.${tld}`;
  });
  
  return blurred;
};

// Function to blur individual phone numbers
export const blurPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return '';
  if (phone.length <= 4) return phone;
  
  const cleaned = phone.replace(/\D/g, ''); // Remove non-digits for processing
  if (cleaned.length < 4) return phone;
  
  // Keep original formatting but blur the digits
  const firstTwo = phone.substring(0, 2);
  const lastTwo = phone.substring(phone.length - 2);
  const middle = '*'.repeat(Math.max(phone.length - 4, 3));
  
  return `${firstTwo}${middle}${lastTwo}`;
};

// Function to blur individual email addresses
export const blurEmailAddress = (email: string | null | undefined): string => {
  if (!email) return '';
  
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
  if (!emailRegex.test(email)) return email;
  
  const [localPart, domain] = email.split('@');
  const blurredLocal = localPart.length > 2 
    ? `${localPart[0]}${'*'.repeat(localPart.length - 2)}${localPart[localPart.length - 1]}`
    : localPart;
  
  const [domainName, tld] = domain.split('.');
  const blurredDomain = domainName.length > 2
    ? `${domainName[0]}${'*'.repeat(domainName.length - 2)}${domainName[domainName.length - 1]}`
    : domainName;
    
  return `${blurredLocal}@${blurredDomain}.${tld}`;
};
