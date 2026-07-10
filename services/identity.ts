export function generatePublicKey(): string {
  const hexChars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += hexChars[Math.floor(Math.random() * 16)];
  }
  return address;
}

export function getOrCreateIdentity(): string {
  let identity = localStorage.getItem('pc_onboarding_email');
  // If no identity exists, or it's not a valid public key (e.g. contains '@' representing old emails), generate a fresh public key
  if (!identity || !identity.startsWith('0x') || identity.includes('@')) {
    identity = generatePublicKey();
    localStorage.setItem('pc_onboarding_email', identity);
  }
  return identity;
}
