export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      
      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p className="text-gray-600">
            By accessing and using this marketplace platform, you accept and agree to be bound by the terms and provision of this agreement.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Use of Service</h2>
          <p className="text-gray-600">
            Our marketplace connects service providers with customers. Users must provide accurate information and maintain the security of their accounts.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Payments and Fees</h2>
          <p className="text-gray-600">
            All payments are processed securely through Stripe. The platform charges a 10% service fee on all transactions. 
            Providers are responsible for delivering services as described in their listings.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. User Conduct</h2>
          <p className="text-gray-600">
            Users agree to use the platform responsibly and not engage in fraudulent, abusive, or illegal activities. 
            We reserve the right to suspend or terminate accounts that violate these terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Liability Limitations</h2>
          <p className="text-gray-600">
            The platform acts as an intermediary and is not responsible for the quality, safety, or legality of services provided. 
            Users engage with providers at their own risk.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Privacy</h2>
          <p className="text-gray-600">
            Your use of our platform is also governed by our Privacy Policy. We are committed to protecting your personal information 
            in accordance with Canadian privacy laws including PIPEDA.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Modifications</h2>
          <p className="text-gray-600">
            We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance 
            of the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Governing Law</h2>
          <p className="text-gray-600">
            These terms are governed by the laws of Canada and the province where services are provided.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Contact</h2>
          <p className="text-gray-600">
            For questions about these terms, please contact us at support@marketplace.com
          </p>
        </section>

        <div className="mt-8 pt-6 border-t text-sm text-gray-500">
          Last updated: January 2025
        </div>
      </div>
    </div>
  );
}