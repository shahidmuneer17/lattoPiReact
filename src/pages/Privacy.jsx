// Privacy Policy — Pi Network app review requirement.
// Edit src/config/legal.js to change company / jurisdiction / contact in one place.
// HAVE A UK SOLICITOR REVIEW THIS BEFORE LAUNCH.
import { Link } from 'react-router-dom';
import LEGAL from '../config/legal';

export default function Privacy() {
  return (
    <article className="prose prose-invert max-w-2xl mx-auto mt-4 space-y-4 text-sm leading-relaxed">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-xs opacity-70">Last updated: {LEGAL.lastUpdated}</p>

      <Section title="1. Who we are">
        <p>
          {LEGAL.brand} is operated by <b>{LEGAL.company}</b>, a company registered in {LEGAL.governingLaw}
          (company number {LEGAL.companyNumber}), with its registered office at {LEGAL.registeredOffice}
          ("we", "us", "our"). For the purposes of the UK GDPR and the Data Protection Act 2018,
          {' '}{LEGAL.company} is the data controller of personal information processed through the {LEGAL.brand} application
          ("the App"), accessible via the Pi Browser.
        </p>
        <p>
          By using the App you agree to this Privacy Policy. If you do not agree, please do not use the App.
        </p>
      </Section>

      <Section title="2. Information we collect">
        <p>We collect only the minimum information needed to operate a lottery and instant-win platform on the Pi Network:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Pi Network identity:</b> your unique Pi user ID (uid) and Pi username, provided by the Pi SDK after you authenticate.</li>
          <li><b>Email address (optional, voluntary):</b> the Pi Network does <b>not</b> share user email addresses with third-party apps. We only have your email if you have explicitly entered it on your Profile page so that we can notify you when you win a draw or when a draw fires early. You can clear it at any time from the same page.</li>
          <li><b>Transaction data:</b> Pi payment IDs, on-chain transaction IDs (txid), amounts and timestamps for each ticket and scratch card you purchase.</li>
          <li><b>Game data:</b> tickets you own, scratch cards you own, draw outcomes and prize amounts.</li>
          <li><b>Technical data:</b> standard server logs (IP address, user agent, request timestamps) retained for security and debugging.</li>
        </ul>
        <p>
          We do <b>not</b> collect: real name, government ID, postal address, phone number, or banking information.
          Pi payments are settled on the Pi blockchain — we never see or store your wallet seed phrase or private keys.
        </p>
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

      <Section title="4. Legal basis for processing (UK GDPR)">
        <p>Our lawful bases under Article 6 of the UK GDPR are:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Contract (Art. 6(1)(b)):</b> processing is necessary to provide the lottery and game services you have requested.</li>
          <li><b>Legitimate interests (Art. 6(1)(f)):</b> security, fraud prevention, and improving the App.</li>
          <li><b>Consent (Art. 6(1)(a)):</b> only for optional features such as email notifications. You may withdraw consent at any time.</li>
          <li><b>Legal obligation (Art. 6(1)(c)):</b> where we are required to retain records by law.</li>
        </ul>
      </Section>

      <Section title="5. Sharing your information">
        <p>We share data only with service providers strictly required to run the App:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Pi Network (Pi Core Team):</b> for authentication and payment verification.</li>
          <li><b>Neon (managed Postgres database):</b> stores user, ticket, card and draw records.</li>
          <li><b>Netlify:</b> hosts the web app and serverless functions.</li>
          <li><b>Maileroo:</b> sends transactional emails (winner notifications) only.</li>
        </ul>
        <p>
          We do <b>not</b> sell, rent, or trade your personal information to advertisers or third-party marketers.
          Our processors are bound by data processing agreements that meet UK GDPR requirements.
        </p>
      </Section>

      <Section title="6. International transfers">
        <p>
          Some of our processors (in particular Neon, Netlify and Pi Network) may process data in the United States,
          the European Union, and other regions outside the UK. Where transfers occur, we rely on UK-approved
          safeguards such as the UK International Data Transfer Agreement (IDTA) or the EU Standard Contractual
          Clauses with the UK Addendum.
        </p>
      </Section>

      <Section title="7. Data retention">
        <p>
          We retain account, ticket, card and draw records for as long as your account exists, plus a reasonable
          period afterwards for audit, dispute resolution, accounting, and provably-fair verification (typically
          up to 6 years to satisfy UK record-keeping obligations). Server logs are retained for up to 90 days.
          You may request earlier deletion (see Section 9).
        </p>
      </Section>

      <Section title="8. Security">
        <p>
          We use industry-standard practices to protect your data: TLS in transit, encrypted database storage,
          least-privilege access, and serverless infrastructure. No system is 100% secure, however, and we cannot
          guarantee absolute security of information transmitted over the internet.
        </p>
      </Section>

      <Section title="9. Your rights under UK GDPR">
        <p>You have the right to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Access the personal data we hold about you (subject access request).</li>
          <li>Have inaccurate data corrected.</li>
          <li>Request erasure of your account and associated data.</li>
          <li>Restrict or object to certain processing.</li>
          <li>Receive a portable copy of your data.</li>
          <li>Withdraw consent at any time, where processing is based on consent.</li>
          <li>Lodge a complaint with the UK Information Commissioner's Office (ICO) at <a href="https://ico.org.uk" className="text-pi-gold underline">ico.org.uk</a>.</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at{' '}
          <a href={`mailto:${LEGAL.legalEmail}`} className="text-pi-gold underline">{LEGAL.legalEmail}</a>.
          We will respond within one month as required by the UK GDPR.
        </p>
      </Section>

      <Section title="10. Cookies">
        <p>
          The App uses only essential storage (a Pi access token in your browser's localStorage) to keep you
          signed in between sessions. We do not use third-party advertising cookies or tracking pixels.
        </p>
      </Section>

      <Section title="11. Children">
        <p>
          The App is strictly for users aged <b>18 and over</b>. We do not knowingly collect personal data from
          anyone under 18. If you believe a minor has provided us data, contact us and we will delete it immediately.
        </p>
      </Section>

      <Section title="12. Changes to this policy">
        <p>
          We may update this Policy from time to time. The "Last updated" date at the top will reflect the
          current version. Material changes will be announced in-app. Continued use of the App after changes
          constitutes acceptance of the new Policy.
        </p>
      </Section>

      <Section title="13. Contact">
        <p>
          Data protection enquiries:{' '}
          <a href={`mailto:${LEGAL.legalEmail}`} className="text-pi-gold underline">{LEGAL.legalEmail}</a><br />
          General support:{' '}
          <a href={`mailto:${LEGAL.contactEmail}`} className="text-pi-gold underline">{LEGAL.contactEmail}</a><br />
          Postal: {LEGAL.company}, {LEGAL.registeredOffice}
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
