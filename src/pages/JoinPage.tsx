import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// import { authService, SocialProvider } from '../services/authService';
import { inviteService, Invite } from '../services/inviteService';
import SocialLogin from '../components/Auth/SocialLogin';
import { 
  Shield, 
  Crown, 
  User, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  ArrowLeft
} from 'lucide-react';

const JoinPage: React.FC = () => {
  const { inviteId } = useParams<{ inviteId: string }>();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    validateInvite();
  }, [inviteId]);

  const validateInvite = async () => {
    if (!inviteId) {
      setError('Invalid invite link');
      setIsLoading(false);
      setIsValidating(false);
      return;
    }

    try {
      const validation = await inviteService.isInviteValid(inviteId);
      if (!validation.valid) {
        setError(validation.error || 'Invalid invite');
        setIsLoading(false);
        setIsValidating(false);
        return;
      }

      setInvite(validation.invite!);
      setIsLoading(false);
      setIsValidating(false);
    } catch (error: any) {
      setError('Failed to validate invite');
      setIsLoading(false);
      setIsValidating(false);
    }
  };

  const handleSocialLoginSuccess = async (user: any) => {
    if (!inviteId) return;

    try {
      // Accept the invite
      await inviteService.acceptInvite(inviteId, user.uid);
      
      // Redirect based on user role
      if (user.role === 'root') {
        navigate('/admin');
      } else if (user.role === 'admin' || user.role === 'volunteer') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      setError('Failed to accept invite: ' + error.message);
    }
  };

  const handleSocialLoginError = (error: string) => {
    setError('Login failed: ' + error);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'root':
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-6 h-6 text-blue-500" />;
      case 'volunteer':
        return <User className="w-6 h-6 text-green-500" />;
      case 'parent':
        return <User className="w-6 h-6 text-purple-500" />;
      default:
        return <User className="w-6 h-6 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'root':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'volunteer':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'parent':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Validating Invitation</h2>
            <p className="text-gray-600">Please wait while we verify your invite...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            {error ? (
              <>
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900">Invalid Invitation</h2>
                <p className="text-red-600 mb-6">{error}</p>
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go Home
                </button>
              </>
            ) : (
              <>
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Loading...</h2>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Invitation Not Found</h2>
            <p className="text-gray-600 mb-6">This invitation link is invalid or has expired.</p>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Join Pack 1703</h2>
          <p className="text-gray-600 mt-2">You've been invited to join our Scout Pack</p>
        </div>

        {/* Invitation Details */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              {getRoleIcon(invite.role)}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(invite.role)}`}>
                {invite.role.replace('_', ' ')}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Invitation for {invite.email}
            </h3>
            
            {invite.message && (
              <p className="text-gray-600 text-sm italic mb-4">
                "{invite.message}"
              </p>
            )}
            
            <div className="text-xs text-gray-500">
              Invited by {invite.invitedByName} • Expires {invite.expiresAt.toLocaleDateString()}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Social Login */}
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Create Your Account</h4>
              <p className="text-sm text-gray-600">Choose your preferred sign-in method</p>
            </div>

            <SocialLogin 
              onSuccess={handleSocialLoginSuccess}
              onError={handleSocialLoginError}
              showEmailOption={true}
              className="mb-6"
            />
          </div>

          {/* Privacy Notice */}
          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">
              By creating an account, you agree to our{' '}
              <a href="/terms" className="text-blue-600 hover:text-blue-500 underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-blue-600 hover:text-blue-500 underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinPage;
