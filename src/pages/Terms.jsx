// Terms of Service required by Pi Network app review.
// HAVE A LAWYER REVIEW BEFORE LAUNCH. Lottery/raffle laws vary widely by
// jurisdiction; the placeholders below are not legal advice.
import { Link } from 'react-router-dom';

const LAST_UPDATED = 'April 8, 2026';
const CONTACT_EMAIL = 'support@lattopi.com';
const COMPANY = 'LattoPi';
const JURISDICTION = 'Dubai, United Arab Emirates';

export default function Terms() {
  return (
    <article className="prose prose-invert max-w-2xl mx-auto mt-4 space-y-4 text-sm leading-relaxed">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-xs opacity-70">Last updated: {LAST_UPDATED}</p>

      <Section title="1. Acceptance">
        <p>
          By creating an account, purchasing tickets, opening scratch cards, or otherwise using
          the LattoPi application ("the App"), you agree to be bound by these Terms of Service ("Terms").
          If you do not agree, do not use the App.
        </p>
      </Section>

      <Section title="2. Eligibility">
        <ul className="list-disc pl-5 space-y-1">
          <li>You must be at least <b>18 years old</b> (or the legal age of majority in your jurisdiction, whichever is greater).</li>
          <li>You must hold a valid Pi Network account in good standing.</li>
          <li>Participation in lotteries and prize draws must be lawful in your jurisdiction. <b>It is your sole responsibility to verify this before participating.</b></li>
          <li>Employees, contractors, and immediate family members of {COMPANY} are not eligible to win prizes.</li>
        </ul>
      </Section>

      <Section title="3. The service">
        <p>LattoPi is a lottery and instant-win platform built on the Pi Network. Currently we offer:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Monthly draw:</b> users buy tickets denominated in Pi (π). At the end of each calendar month one winner is selected via a provably-fair process and awarded a prize of <b>25 π</b>.</li>
          <li><b>Instant scratch cards:</b> users buy cards which, when scratched, immediately reveal a fixed-tier reward (between 0 π and 25 π) determined by a deterministic seed committed at purchase.</li>
        </ul>
        <p>Prize amounts and game rules may be updated at any time. Continued use after changes constitutes acceptance.</p>
      </Section>

      <Section title="4. Provably-fair draws">
        <p>
          Each monthly draw uses HMAC-SHA256 over a 256-bit random seed and the sorted list of ticket IDs
          to select a winner. The seed and resulting proof hash are stored in our database and made
          available on request, allowing any user to independently verify that the draw was not manipulated.
          Scratch card outcomes are derived from a per-card seed committed at purchase time.
        </p>
      </Section>

      <Section title="5. Payments">
        <ul className="list-disc pl-5 space-y-1">
          <li>All purchases are denominated and settled in Pi (π) on the Pi Network.</li>
          <li>You authorise the App to verify your payments via the Pi Platform API.</li>
          <li><b>All sales are final.</b> Once a payment is confirmed on the Pi blockchain we cannot reverse it. Tickets and scratch cards are non-refundable.</li>
          <li>You are solely responsible for the security of your Pi wallet and credentials.</li>
        </ul>
      </Section>

      <Section title="6. Prizes & payouts">
        <ul className="list-disc pl-5 space-y-1">
          <li>The monthly draw prize is fixed at <b>25 π</b>, paid via Pi A2U (App-to-User) payment to the winner's Pi wallet.</li>
          <li>Scratch card rewards are credited to the user's account balance and may be cashed out subject to minimum thresholds.</li>
          <li>Payouts are processed within a reasonable time after the draw or claim, subject to KYC, anti-fraud checks, and the operational status of the Pi Network.</li>
          <li>Unclaimed prizes may be forfeited after 90 days.</li>
          <li>Any taxes, withholdings, or reporting obligations on prizes are the sole responsibility of the winner.</li>
        </ul>
      </Section>

      <Section title="7. Acceptable use">
        <p>You agree NOT to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Use the App if it is illegal for you to participate in lotteries or prize draws.</li>
          <li>Create multiple Pi accounts or use any other means to circumvent fairness or limits.</li>
          <li>Attempt to interfere with, reverse-engineer, or compromise the App's infrastructure.</li>
          <li>Use the App to launder funds or for any other unlawful purpose.</li>
          <li>Resell, scalp, or transfer tickets to other users.</li>
        </ul>
        <p>We reserve the right to suspend or terminate accounts that violate these Terms, void tickets purchased in bad faith, and withhold prizes pending investigation.</p>
      </Section>

      <Section title="8. No warranty">
        <p>
          The App is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, express or implied,
          including but not limited to merchantability, fitness for a particular purpose, or non-infringement.
          We do not warrant that the App will be uninterrupted, error-free, or secure.
        </p>
      </Section>

      <Section title="9. Limitation of liability">
        <p>
          To the maximum extent permitted by law, {COMPANY} and its affiliates shall not be liable for any
          indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or
          goodwill, arising from your use of (or inability to use) the App. Our total liability for any claim
          shall not exceed the total Pi value of the purchases you made through the App in the 30 days preceding the claim.
        </p>
      </Section>

      <Section title="10. Indemnity">
        <p>
          You agree to indemnify and hold harmless {COMPANY}, its officers, contractors, and affiliates from
          any claims, damages, or expenses arising from your breach of these Terms, your misuse of the App,
          or your violation of any law or third-party right.
        </p>
      </Section>

      <Section title="11. Governing law">
        <p>
          These Terms are governed by the laws of {JURISDICTION}, without regard to conflict of law principles.
          Any dispute shall be submitted to the exclusive jurisdiction of the courts of {JURISDICTION}.
        </p>
      </Section>

      <Section title="12. Responsible play">
        <p>
          Lotteries and games of chance can be addictive. Only spend what you can afford to lose. If you feel
          your participation is becoming a problem, please seek help from a professional service in your
          country, or contact us to self-exclude from the App.
        </p>
      </Section>

      <Section title="13. Changes">
        <p>
          We may modify these Terms at any time. Material changes will be announced in-app or via email.
          Continued use after changes constitutes acceptance.
        </p>
      </Section>

      <Section title="14. Pi Network">
        <p>
          LattoPi is an independent third-party application built on the Pi Network. We are not affiliated with,
          endorsed by, or sponsored by Pi Core Team. "Pi", "Pi Network", "Pi Browser", and "π" are trademarks
          of their respective owners.
        </p>
      </Section>

      <Section title="15. Contact">
        <p>Questions about these Terms: <a href={`mailto:${CONTACT_EMAIL}`} className="text-pi-gold underline">{CONTACT_EMAIL}</a></p>
      </Section>

      <p className="text-xs opacity-60 pt-4">
        See also: <Link to="/privacy" className="text-pi-gold underline">Privacy Policy</Link>
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
