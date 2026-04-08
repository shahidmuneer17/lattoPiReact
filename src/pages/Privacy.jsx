// Privacy Policy required by Pi Network app review.
// You MUST review this with a lawyer before going to mainnet — placeholder
// jurisdiction (UAE / Dubai) and contact details should be replaced with yours.
import { Link } from 'react-router-dom';

const LAST_UPDATED = 'April 8, 2026';
const CONTACT_EMAIL = 'support@lattopi.com';
const COMPANY = 'LattoPi';

export default function Privacy() {
  return (
    <article className="prose prose-invert max-w-2xl mx-auto mt-4 space-y-4 text-sm leading-relaxed">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-xs opacity-70">Last updated: {LAST_UPDATED}</p>

      <Section title="1. Introduction">
        <p>
          {COMPANY} ("we", "us", "our") operates the LattoPi application accessible via the Pi Browser
          ("the App"). This Privacy Policy explains what personal information we collect, how we use it,
          who we share it with, and the rights you have over it. By using the App you agree to this Policy.
        </p>
      </Section>

      <Section title="2. Information we collect">
        <p>We collect the minimum information needed to operate a lottery and instant-win platform on the Pi Network:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Pi Network identity:</b> your unique Pi user ID (uid) and Pi username, provided by the Pi SDK after you authenticate.</li>
          <li><b>Email address (optional):</b> only if you choose to provide one for winner notifications.</li>
          <li><b>Transaction data:</b> Pi payment IDs, on-chain transaction IDs (txid), amounts, and timestamps for each ticket and scratch card you purchase.</li>
          <li><b>Game data:</b> tickets you own, scratch cards you own, draw outcomes, and prize amounts.</li>
          <li><b>Technical data:</b> standard server logs (IP address, user agent, request timestamps) retained for security and debugging.</li>
        </ul>
        <p>We do <b>not</b> collect: real name, government ID, address, phone number, or banking information. Pi payments are settled on the Pi blockchain — we never see or store your wallet seed or private keys.</p>
      </Section>

      <Section title="3. How we use your information">
        <ul className="list-disc pl-5 space-y-1">
          <li>To authenticate you via the Pi Network and create your account.</li>
          <li>To process Pi payments, issue tickets and scratch cards, and run draws.</li>
          <li>To notify you (by email, if provided) when you win a draw.</li>
          <li>To compute provably-fair winner selection and to publish verifiable proofs of fairness.</li>
          <li>To protect the App from fraud, abuse, and technical failures.</li>
          <li>To comply with applicable legal obligations.</li>
        </ul>
      </Section>

      <Section title="4. Legal basis (GDPR users)">
        <p>If you reside in the European Economic Area or the UK, our legal basis for processing your data is:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Contract:</b> processing is necessary to provide the lottery service you've requested.</li>
          <li><b>Legitimate interest:</b> security, fraud prevention, and improving the App.</li>
          <li><b>Consent:</b> only for optional features such as email notifications.</li>
        </ul>
      </Section>

      <Section title="5. Sharing your information">
        <p>We share data only with service providers strictly required to run the App:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Pi Network (Pi Core Team):</b> for authentication and payment verification.</li>
          <li><b>Neon (Postgres database):</b> stores user, ticket, card, and draw records.</li>
          <li><b>Netlify:</b> hosts the web app and serverless functions.</li>
          <li><b>Maileroo:</b> sends transactional emails (winner notifications) only.</li>
        </ul>
        <p>We do <b>not</b> sell, rent, or trade your personal information to advertisers or third-party marketers.</p>
      </Section>

      <Section title="6. Data retention">
        <p>
          We retain account, ticket, card, and draw records for as long as your account exists, plus
          a reasonable period afterward for audit, dispute resolution, and provably-fair verification.
          Server logs are retained for up to 90 days. You may request deletion (see Section 8).
        </p>
      </Section>

      <Section title="7. Security">
        <p>
          We use industry-standard practices to protect your data: TLS in transit, encrypted database storage,
          least-privilege access, and serverless infrastructure. No system is 100% secure, however, and we cannot
          guarantee absolute security of information transmitted over the internet.
        </p>
      </Section>

      <Section title="8. Your rights">
        <p>Subject to applicable law, you have the right to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Access the personal data we hold about you.</li>
          <li>Correct inaccurate data.</li>
          <li>Request deletion of your account and associated data.</li>
          <li>Object to or restrict certain processing.</li>
          <li>Receive a portable copy of your data.</li>
          <li>Lodge a complaint with your local data protection authority.</li>
        </ul>
        <p>To exercise any of these rights, contact us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-pi-gold underline">{CONTACT_EMAIL}</a>.</p>
      </Section>

      <Section title="9. Children">
        <p>
          The App is not directed to anyone under 18. We do not knowingly collect personal data from minors.
          If you believe a minor has provided us data, contact us and we will delete it.
        </p>
      </Section>

      <Section title="10. International transfers">
        <p>
          Our service providers (Neon, Netlify, Maileroo, Pi Network) may process data in the United States,
          European Union, and other regions. By using the App you consent to these transfers.
        </p>
      </Section>

      <Section title="11. Changes to this policy">
        <p>
          We may update this Policy from time to time. The "Last updated" date at the top will reflect the
          current version. Continued use of the App after changes constitutes acceptance of the new Policy.
        </p>
      </Section>

      <Section title="12. Contact">
        <p>
          Questions about this Policy or your data: <a href={`mailto:${CONTACT_EMAIL}`} className="text-pi-gold underline">{CONTACT_EMAIL}</a>
        </p>
      </Section>

      <p className="text-xs opacity-60 pt-4">
        See also: <Link to="/terms" className="text-pi-gold underline">Terms of Service</Link>
      </p>
    </article>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mt-6 mb-2">{title}</h2>
      <div className="opacity-90 space-y-2">{children}</div>
    </section>
  );
}
