// Centralised legal/contact constants — update once, used everywhere
// (Privacy, Terms, Footer, About, etc.). Update these BEFORE launch.

export const LEGAL = {
  // Operating company
  company: 'LattoPi Ltd',                    // ← your registered UK company name
  registeredOffice: 'London, United Kingdom', // ← full registered address
  companyNumber: '00000000',                 // ← Companies House number
  // The brand name shown to users (separate from the legal entity if you like)
  brand: 'LattoPi',

  // Contact
  contactEmail: 'support@lattopi.com',
  legalEmail: 'legal@lattopi.com',

  // Governing law / dispute resolution
  governingLaw: 'England and Wales',
  jurisdictionForum: 'the courts of England and Wales',

  // Restricted territories — users from these jurisdictions cannot participate.
  // Update based on your legal advice.
  restrictedTerritories: [
    'United Kingdom', // see UK Gambling Act 2005 — see NEXT_STEPS / lawyer advice
    'United States',
    'France',
    'Australia',
    'Singapore',
    // any other jurisdiction where unlicensed lotteries are illegal
  ],

  // Last-updated stamp shown at the top of Privacy / Terms
  lastUpdated: 'April 8, 2026',
};

export default LEGAL;
