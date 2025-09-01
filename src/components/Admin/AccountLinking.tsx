import React, { useState } from 'react';
import { authService, SocialProvider } from '../../services/authService';
import { Apple, Chrome, Facebook, Github, Twitter, Link, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface AccountLinkingProps {
  className?: string;
}

const AccountLinking: React.FC<AccountLinkingProps> = ({ className = '' }) => {
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const socialProviders = [
    {
      provider: SocialProvider.APPLE,
      name: 'Apple',
      icon: Apple,
      description: 'Link your Apple ID',
      className: 'bg-black text-white hover:bg-gray-800 border-black'
    },
    {
      provider: SocialProvider.GOOGLE,
      name: 'Google',
      icon: Chrome,
      description: 'Link your Google account',
      className: 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
    },
    {
      provider: SocialProvider.FACEBOOK,
      name: 'Facebook',
      icon: Facebook,
      description: 'Link your Facebook account',
      className: 'bg-[#1877F2] text-white hover:bg-[#166FE5] border-[#1877F2]'
    },
    {
      provider: SocialProvider.GITHUB,
      name: 'GitHub',
      icon: Github,
      description: 'Link your GitHub account',
      className: 'bg-[#24292e] text-white hover:bg-[#1b1f23] border-[#24292e]'
    },
    {
      provider: SocialProvider.TWITTER,
      name: 'Twitter',
      icon: Twitter,
      description: 'Link your Twitter account',
      className: 'bg-[#1DA1F2] text-white hover:bg-[#1a91da] border-[#1DA1F2]'
    }
  ];

  const handleLinkAccount = async (provider: SocialProvider) => {
    setIsLinking(true);
    setError(null);
    setSuccess(null);

    try {
      await authService.linkSocialAccount(provider);
      setSuccess(`Successfully linked your ${provider} account!`);
    } catch (error: any) {
      console.error(`Error linking ${provider} account:`, error);
      
      if (error.code === 'auth/operation-not-allowed') {
        setError(`${provider} sign-in is not enabled. Please enable it in Firebase Console.`);
      } else if (error.code === 'auth/credential-already-in-use') {
        setError(`This ${provider} account is already linked to another user.`);
      } else if (error.code === 'auth/email-already-in-use') {
        setError(`An account with this email already exists.`);
      } else {
        setError(`Failed to link ${provider} account: ${error.message}`);
      }
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <Link className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Link Social Accounts</h2>
      </div>

      <p className="text-gray-600 mb-6">
        Link your social media accounts to your root account for easier sign-in and enhanced security.
      </p>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Social Account Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {socialProviders.map(({ provider, name, icon: Icon, description, className: btnClassName }) => (
          <button
            key={provider}
            onClick={() => handleLinkAccount(provider)}
            disabled={isLinking}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg font-medium
              border transition-all duration-200 transform hover:scale-[1.02]
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              shadow-sm hover:shadow-md ${btnClassName}
            `}
          >
            {isLinking ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Icon className="w-5 h-5" />
            )}
            <div className="text-left">
              <div className="font-medium">
                {isLinking ? `Linking...` : `Link ${name}`}
              </div>
              <div className="text-sm opacity-75">
                {description}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">💡 Benefits of Linking Accounts</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Sign in with Face ID/Touch ID on Apple devices</li>
          <li>• Enhanced security with social provider authentication</li>
          <li>• Multiple sign-in methods for account recovery</li>
          <li>• Faster access to your admin dashboard</li>
        </ul>
      </div>

      {/* Setup Instructions */}
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-medium text-yellow-900 mb-2">⚠️ Setup Required</h3>
        <p className="text-sm text-yellow-800 mb-2">
          If you see "operation-not-allowed" errors, you need to enable social sign-in providers in Firebase Console.
        </p>
        <a 
          href="https://console.firebase.google.com/project/pack-1703-portal/authentication/providers"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-yellow-900 underline hover:text-yellow-700"
        >
          Open Firebase Console →
        </a>
      </div>
    </div>
  );
};

export default AccountLinking;
