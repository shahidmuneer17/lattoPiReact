// Terms of Service — Pi Network app review requirement.
// Edit src/config/legal.js to change company / jurisdiction / contact in one place.
// HAVE A UK GAMBLING SOLICITOR REVIEW THIS BEFORE LAUNCH — UK Gambling Act 2005
// applies to paid prize draws even when prizes are denominated in cryptocurrency.
import { Link } from 'react-router-dom';
import LEGAL from '../config/legal';

export default function Terms() {
  return (
    <article className="prose prose-invert max-w-2xl mx-auto mt-4 space-y-4 text-sm leading-relaxed">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-xs opacity-70">Last updated: {LEGAL.lastUpdated}</p>

      <Section title="1. About these Terms">
        <p>
          These Terms of Service ("Terms") form a legally binding agreement between you and{' '}
          <b>{LEGAL.company}</b>, a company registered in {LEGAL.governingLaw} (company number {LEGAL.companyNumber}),
          with its registered office at {LEGAL.registeredOffice} ("we", "us", "our"), governing your use of
          the {LEGAL.brand} application accessible via the Pi Browser ("the App").
        </p>
        <p>
          By creating an account, purchasing tickets, opening scratch cards, or otherwise using the App,
          you confirm that you accept these Terms. If you do not agree, do not use the App.
        </p>
      </Section>

      <Section title="2. Eligibility">
        <ul className="list-disc pl-5 space-y-1">
          <li>You must be at least <b>18 years old</b> (or the legal age of majority in your jurisdiction, whichever is greater).</li>
          <li>You must hold a valid Pi Network account in good standing.</li>
          <li>Participation in lotteries, prize draws and games of chance must be lawful in your jurisdiction. <b>It is your sole responsibility to ensure your participation does not breach any law applicable to you.</b></li>
          <li>Employees, contractors, officers, and immediate family members of {LEGAL.company} are not eligible to win prizes.</li>
        </ul>
      </Section>

      <Section title="3. Restricted Territories">
        <p>
          The App is <b>not available</b> to residents or persons physically located in any of the following
          jurisdictions, where unlicensed lotteries or remote gambling are prohibited or where we do not
          currently hold the relevant authorisation:
        </p>
        <ul className="list-disc pl-5 space-y-1 columns-2">
          {LEGAL.restrictedTerritories.map((t) => <li key={t}>{t}</li>)}
        </ul>
        <p>
          By using the App you represent and warrant that you are not a resident of, and not physically
          located in, any restricted territory. We may use IP geolocation, Pi Browser metadata, and other
          signals to enforce this. We reserve the right to void any tickets, scratch cards, or prizes
          purchased or won in breach of this section, without refund.
        </p>
      </Section>

      <Section title="4. The service">
        <p>{LEGAL.brand} is a lottery and instant-win platform built on the Pi Network. We currently offer:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Monthly draw:</b> users buy tickets denominated in Pi (π) at <b>0.5 π per ticket</b>. There is no maximum number of tickets a user may purchase. One winner is selected via a provably-fair process and awarded a fixed prize of <b>10,000 π</b>.</li>
          <li><b>Instant scratch cards:</b> users buy cards at <b>0.5 π per card</b>. When scratched, each card immediately reveals a reward between <b>0 π and 1,000 π</b>, determined by a deterministic seed committed at the moment of purchase, subject to the platform safety rule in Section 7.</li>
        </ul>
        <p>Game rules, prize amounts and ticket prices may be updated at any time on prior notice. Continued use after changes constitutes acceptance.</p>
      </Section>

      <Section title="4a. When the draw happens">
        <p>
          To make sure each draw is meaningful, the monthly draw fires only after a minimum number of tickets
          have been sold. We do not publish the exact threshold, and it may change from time to time. Two
          things can happen:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Minimum reached early:</b> if the threshold is hit before the end of the calendar month, the draw will be executed the <b>next day</b> and all participants with an email on file will be notified.</li>
          <li><b>Minimum not reached by month-end:</b> all active tickets remain valid and their expiry date is automatically extended by one day at a time until the threshold is met. No action is required from you, and you will not be charged again.</li>
        </ul>
        <p>You can request a refund only in the cases set out in Section 6.</p>
      </Section>

      <Section title="5. Provably-fair draws">
        <p>
          Each monthly draw uses HMAC-SHA256 over a 256-bit random seed and the sorted list of ticket IDs
          to select a winner. The seed and resulting proof hash are stored in our database and made available
          on request, allowing any user to independently verify that the draw was not manipulated. Scratch card
          outcomes are derived from a per-card seed committed at purchase time, before any reveal interaction.
        </p>
      </Section>

      <Section title="6. Payments">
        <ul className="list-disc pl-5 space-y-1">
          <li>All purchases are denominated and settled in Pi (π) on the Pi Network.</li>
          <li>You authorise us to verify your payments via the Pi Platform API.</li>
          <li><b>All sales are final.</b> Once a payment is confirmed on the Pi blockchain we cannot reverse it. Tickets and scratch cards are non-refundable.</li>
          <li>You are solely responsible for the security of your Pi wallet, credentials, and seed phrase.</li>
        </ul>
      </Section>

      <Section title="7. Prizes & payouts">
        <ul className="list-disc pl-5 space-y-1">
          <li>The monthly draw prize is fixed at <b>10,000 π</b>, paid via Pi App-to-User (A2U) payment to the winner's verified Pi wallet.</li>
          <li>Scratch card rewards range from <b>0 π to 1,000 π</b> per card and are credited to the user's account on reveal.</li>
          <li>
            <b>Scratch card platform safety rule:</b> at any moment, total cumulative scratch-card payouts shall
            never exceed a fixed percentage (currently 50%) of total cumulative scratch-card sales. If, at the
            time of reveal, granting a non-zero reward would cause cumulative payouts to exceed that
            percentage, the reward for that card will be capped at 0 π. This rule exists to keep the platform
            solvent and is the only condition under which a determinstic reveal can be downgraded.
          </li>
          <li>Payouts are processed within a reasonable time, subject to anti-fraud checks and the operational status of the Pi Network.</li>
          <li>Unclaimed prizes are forfeited after 90 days.</li>
          <li>Any taxes, withholdings, or reporting obligations on prizes are the sole responsibility of the winner.</li>
        </ul>
      </Section>

      <Section title="8. Acceptable use">
        <p>You agree NOT to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Use the App if you are located in a Restricted Territory (Section 3) or if it is otherwise unlawful for you to participate.</li>
          <li>Create multiple Pi accounts or use any other means to circumvent fairness, limits, or restricted-territory rules.</li>
          <li>Attempt to interfere with, reverse-engineer, or compromise the App's infrastructure.</li>
          <li>Use the App to launder funds, finance terrorism, or for any other unlawful purpose.</li>
          <li>Resell, scalp, or transfer tickets or scratch cards to other users.</li>
        </ul>
        <p>
          We reserve the right to suspend or terminate accounts that violate these Terms, void tickets purchased
          in bad faith, and withhold prizes pending investigation.
        </p>
      </Section>

      <Section title="8a. Referral programme">
        <p>
          {LEGAL.brand} operates an optional referral programme. Each user is assigned a unique
          referral code on first login. When you share your code with a friend and they sign in
          using your link, you become eligible to earn commission on their activity, subject to
          the rules below.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Activation gate:</b> commission is paid only once the referred user has spent at least <b>10 π</b> on lottery tickets in their lifetime. Until that threshold is reached, no commission is earned. Card purchases do not count toward the gate.</li>
          <li><b>Commission rate:</b> 1% of every subsequent ticket purchase the referred user makes, AND 1% of every winning prize they receive (scratch card win or monthly draw win). Both rates may be adjusted at any time on prior notice.</li>
          <li><b>Where commission is held:</b> earnings accumulate in a dedicated balance on your account, viewable on your Profile page. Earnings do not expire.</li>
          <li><b>Cash-out:</b> you may request a payout of your accumulated commission once it reaches the configured minimum (currently 5 π). Payouts are processed manually within a reasonable time and paid to your verified Pi wallet.</li>
          <li><b>Self-referral and multi-account farming are prohibited.</b> Using your own code, creating secondary accounts to refer yourself, coordinating with other users to inflate commission, or otherwise abusing the programme will result in forfeiture of all referral earnings and may lead to account suspension.</li>
          <li><b>No commission on safety-downgraded card reveals:</b> if a scratch card reveal is capped at 0 π by the platform's solvency safety rule (Section 7), no referral commission is earned for that card.</li>
          <li><b>Locked once set:</b> the referrer link between two users is set on first login of the referred user and cannot be changed afterwards.</li>
          <li><b>Right to void:</b> {LEGAL.company} reserves the right to void any commission earned in breach of these rules, reject a payout request, or terminate a user's participation in the referral programme at its sole discretion.</li>
          <li><b>Programme changes:</b> we may modify, suspend, or terminate the referral programme at any time. Accumulated balances at the moment of any change will remain payable subject to these Terms.</li>
        </ul>
      </Section>

      <Section title="9. Responsible play">
        <p>
          Lotteries and games of chance can be addictive. Only spend what you can afford to lose. If you feel
          your participation is becoming a problem, please seek help from a professional service in your
          country (in the UK: <a href="https://www.gamcare.org.uk" className="text-pi-gold underline">GamCare</a>{' '}
          or <a href="https://www.begambleaware.org" className="text-pi-gold underline">BeGambleAware</a>),
          or contact us to self-exclude from the App.
        </p>
      </Section>

      <Section title="10. No warranty">
        <p>
          The App is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, express or implied,
          including but not limited to merchantability, fitness for a particular purpose, or non-infringement.
          We do not warrant that the App will be uninterrupted, error-free, or secure.
        </p>
      </Section>

      <Section title="11. Limitation of liability">
        <p>
          Nothing in these Terms excludes or limits our liability for death or personal injury caused by our
          negligence, fraud, fraudulent misrepresentation, or any other liability that cannot be excluded by law.
          Subject to that, to the maximum extent permitted by law:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{LEGAL.company} and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or goodwill.</li>
          <li>Our total aggregate liability for any claim shall not exceed the total Pi value of the purchases you made through the App in the 30 days preceding the claim.</li>
        </ul>
      </Section>

      <Section title="12. Indemnity">
        <p>
          You agree to indemnify and hold harmless {LEGAL.company}, its officers, contractors and affiliates from
          any claims, damages, or expenses arising from your breach of these Terms, your misuse of the App, or
          your violation of any law or third-party right.
        </p>
      </Section>

      <Section title="13. Governing law and jurisdiction">
        <p>
          These Terms and any dispute or claim arising out of or in connection with them are governed by, and
          construed in accordance with, the laws of <b>{LEGAL.governingLaw}</b>. You and we irrevocably agree
          that {LEGAL.jurisdictionForum} shall have exclusive jurisdiction to settle any dispute or claim
          arising out of or in connection with these Terms.
        </p>
      </Section>

      <Section title="14. Changes">
        <p>
          We may modify these Terms at any time. Material changes will be announced in-app or via email.
          Continued use after changes constitutes acceptance.
        </p>
      </Section>

      <Section title="15. Pi Network disclaimer">
        <p>
          {LEGAL.brand} is an independent third-party application built on the Pi Network. We are not affiliated
          with, endorsed by, or sponsored by Pi Core Team. "Pi", "Pi Network", "Pi Browser", and "π" are
          trademarks of their respective owners.
        </p>
      </Section>

      <Section title="16. Contact">
        <p>
          Questions about these Terms:{' '}
          <a href={`mailto:${LEGAL.legalEmail}`} className="text-pi-gold underline">{LEGAL.legalEmail}</a><br />
          General support:{' '}
          <a href={`mailto:${LEGAL.contactEmail}`} className="text-pi-gold underline">{LEGAL.contactEmail}</a><br />
          Postal: {LEGAL.company}, {LEGAL.registeredOffice}
        </p>
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
