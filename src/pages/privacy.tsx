export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
          <p className="text-gray-600 mb-3">We collect information you provide directly to us, including:</p>
          <ul className="list-disc ml-6 text-gray-600 space-y-1">
            <li>Account information (name, email, phone number)</li>
            <li>Payment information (processed securely by Stripe)</li>
            <li>Service listings and booking details</li>
            <li>Communications between users and providers</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
          <p className="text-gray-600 mb-3">We use the information we collect to:</p>
          <ul className="list-disc ml-6 text-gray-600 space-y-1">
            <li>Facilitate bookings and payments</li>
            <li>Communicate with you about your account and transactions</li>
            <li>Improve and personalize our services</li>
            <li>Comply with legal obligations</li>
            <li>Detect and prevent fraud</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
          <p className="text-gray-600">
            We do not sell or rent your personal information. We share information only in these circumstances:
          </p>
          <ul className="list-disc ml-6 text-gray-600 space-y-1 mt-2">
            <li>With providers and customers to facilitate transactions</li>
            <li>With Stripe for payment processing</li>
            <li>When required by law or to protect rights and safety</li>
            <li>With your consent</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
          <p className="text-gray-600">
            We implement appropriate technical and organizational measures to protect your personal information against 
            unauthorized access, alteration, disclosure, or destruction. Payment information is encrypted and processed 
            securely by Stripe.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Your Rights (PIPEDA Compliance)</h2>
          <p className="text-gray-600 mb-3">Under Canadian privacy law, you have the right to:</p>
          <ul className="list-disc ml-6 text-gray-600 space-y-1">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Withdraw consent for certain uses</li>
            <li>Request deletion of your information (subject to legal requirements)</li>
            <li>File a complaint with the Privacy Commissioner of Canada</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
          <p className="text-gray-600">
            We retain your information for as long as necessary to provide services and comply with legal obligations. 
            Transaction records are retained for 7 years for tax and regulatory compliance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Cookies and Tracking</h2>
          <p className="text-gray-600">
            We use cookies and similar technologies to maintain sessions, remember preferences, and analyze usage. 
            You can control cookies through your browser settings.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Children's Privacy</h2>
          <p className="text-gray-600">
            Our services are not directed to individuals under 18. We do not knowingly collect personal information 
            from children.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Changes to This Policy</h2>
          <p className="text-gray-600">
            We may update this privacy policy from time to time. We will notify you of material changes by posting 
            the new policy on this page and updating the "last updated" date.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Contact Us</h2>
          <p className="text-gray-600">
            For privacy-related questions or to exercise your rights, contact our Privacy Officer at:
          </p>
          <div className="mt-2 text-gray-600">
            <p>Email: privacy@marketplace.com</p>
            <p>Mail: Privacy Officer, Marketplace Inc., Toronto, ON, Canada</p>
          </div>
        </section>

        <div className="mt-8 pt-6 border-t text-sm text-gray-500">
          <p>Last updated: January 2025</p>
          <p className="mt-2">This privacy policy complies with the Personal Information Protection and Electronic Documents Act (PIPEDA)</p>
        </div>
      </div>
    </div>
  );
}