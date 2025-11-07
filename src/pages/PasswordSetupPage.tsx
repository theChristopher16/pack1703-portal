import React from 'react';
import { Link } from 'react-router-dom';
import { KeyRound } from 'lucide-react';

const PasswordSetupPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/40 to-solar-50/30 flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full bg-white/92 backdrop-blur-2xl border border-forest-200/40 shadow-2xl rounded-3xl p-10 space-y-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-solarpunk shadow-glow mx-auto">
          <KeyRound className="w-8 h-8 text-white" />
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-solarpunk-display font-bold text-forest-700">
            Create Your Pack Password
          </h1>
          <p className="text-base leading-relaxed text-forest-600">
            We&apos;re getting your account ready for adventures. Choose a strong password using the secure link we emailed you and you&apos;ll be ready to explore the portal.
          </p>
        </div>

        <div className="space-y-2 text-sm text-forest-500">
          <p>
            This page is here to confirm that you&apos;re on the right link. Follow the instructions in the email to finish setting up your login and then sign in from the home page.
          </p>
          <p>
            Questions or need help? Email <a className="text-ocean-600 font-semibold hover:text-ocean-700" href="mailto:cubmaster@sfpack1703.com">cubmaster@sfpack1703.com</a> and our team will assist.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="solarpunk-btn-secondary w-full sm:w-auto justify-center"
          >
            Go to Home
          </Link>
          <Link
            to="/feedback"
            className="solarpunk-btn-primary w-full sm:w-auto justify-center"
          >
            Share Feedback
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PasswordSetupPage;
