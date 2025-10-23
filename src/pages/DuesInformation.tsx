import React from 'react';

const DuesInformation: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-ink mb-2">Dues Information</h1>
        <p className="text-teal-700">National BSA dues and Pack 1703 dues overview, payment options, and key deadlines.</p>
      </div>

      {/* National Dues Section */}
      <section className="mb-10">
        <div className="bg-yellow-50 border border-yellow-200 rounded-brand p-6">
          <h2 className="text-xl font-semibold text-ink mb-3">National BSA Dues</h2>
          <div className="mb-3 text-sm text-yellow-800">
            <p className="font-medium">Important:</p>
            <p>
              National dues are set by BSA National and can change. This information is manually maintained while we work with BSA to gain API access for automatic updates. Please verify current rates at the official BSA site.
            </p>
          </div>
          <ul className="list-disc list-inside text-teal-800 space-y-1">
            <li>Annual national registration dues: See official guidance</li>
            <li>One-time joining fees (if applicable): See official guidance</li>
            <li>Scout Life magazine (optional): See official guidance</li>
          </ul>
          <div className="mt-3">
            <a href="https://www.scouting.org" className="text-primary-600 hover:underline" target="_blank" rel="noreferrer">Verify at scouting.org</a>
          </div>
        </div>
      </section>

      {/* Pack Dues Section */}
      <section className="mb-10">
        <div className="bg-white border border-cloud rounded-brand p-6 shadow-card">
          <h2 className="text-xl font-semibold text-ink mb-3">Pack 1703 Dues</h2>
          <p className="text-teal-800 mb-3">Covers local activities, awards, supplies, and insurance.</p>
          <ul className="list-disc list-inside text-teal-800 space-y-1">
            <li>Annual pack dues: Set by the pack each year</li>
            <li>What’s included: Awards, materials, event subsidies</li>
            <li>Scholarships: Available upon request; please contact leadership</li>
          </ul>
        </div>
      </section>

      {/* Payment & Deadlines Section */}
      <section className="mb-6">
        <div className="bg-secondary-50 border border-secondary-200 rounded-brand p-6">
          <h2 className="text-xl font-semibold text-ink mb-3">Payments & Deadlines</h2>
          <ul className="list-disc list-inside text-teal-800 space-y-1">
            <li>Accepted methods: Online card payments and in-person collection</li>
            <li>Deadlines: Announced at the start of the season and via email</li>
            <li>Receipts: Emailed automatically for online payments</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default DuesInformation;


