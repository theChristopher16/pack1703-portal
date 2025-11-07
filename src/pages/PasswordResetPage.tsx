import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

const PasswordResetPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/40 to-solar-50/30 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white/90 backdrop-blur-xl border border-forest-200/40 shadow-2xl rounded-3xl p-10 space-y-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-solarpunk shadow-glow mx-auto">
          <Shield className="w-8 h-8 text-white" />
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-solarpunk-display font-bold text-forest-700">
            Password Reset Email Sent
          </h1>
          <p className="text-base leading-relaxed text-forest-600">
            If an account matches the email address you entered, we just sent a secure link that will let you choose a new password.
            Please check your inbox and follow the steps inside the message to complete the reset.
          </p>
        </div>

        <div className="space-y-2 text-sm text-forest-500">
          <p>
            Didn&apos;t receive the email? Be sure to check spam or promotions folders, and request another reset from the login screen if needed.
          </p>
          <p>
            Need more help? Reach out to <a className="text-ocean-600 font-semibold hover:text-ocean-700" href="mailto:cubmaster@sfpack1703.com">cubmaster@sfpack1703.com</a> and we&apos;ll make sure you get back in quickly.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="solarpunk-btn-secondary w-full sm:w-auto justify-center"
          >
            Return to Home
          </Link>
          <Link
            to="/profile"
            className="solarpunk-btn-primary w-full sm:w-auto justify-center"
          >
            Open Account Tools
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetPage;
