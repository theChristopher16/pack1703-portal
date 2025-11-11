import React, { useState } from 'react';
import { Link2, CheckCircle, Loader } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase/config';
import { useToast } from '../../contexts/ToastContext';

/**
 * Component to fix missing crossOrganizationUsers link
 * Appears when user has RSVPs but no organization membership
 */
const FixOrgLink: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [fixing, setFixing] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleAutoLink = async () => {
    try {
      setFixing(true);
      const autoLinkFunction = httpsCallable(functions, 'autoLinkToPack1703');
      const result = await autoLinkFunction({});
      const data = result.data as any;

      if (data.success) {
        showSuccess(data.message);
        onSuccess();
      } else {
        showError('Auto-link failed', data.message);
      }
    } catch (error: any) {
      showError('Failed to link account', error.message);
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-orange-500 rounded-xl flex-shrink-0">
          <Link2 className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-orange-900 mb-2">Account Link Missing</h3>
          <p className="text-sm text-orange-800 mb-4">
            Your account isn't properly linked to Pack 1703 in the system. This is why your calendar
            events aren't appearing. I found {3} RSVPs in your account, so you're definitely a member!
          </p>
          <p className="text-sm text-orange-700 mb-4">
            Click the button below to automatically fix this issue:
          </p>
          
          <button
            onClick={handleAutoLink}
            disabled={fixing}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center gap-2 font-semibold"
          >
            {fixing ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Linking...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Fix My Account Link
              </>
            )}
          </button>
          
          <p className="text-xs text-orange-600 mt-3">
            This will create a crossOrganizationUsers record linking you to Pack 1703.
            After this, run diagnostics again and your events should appear!
          </p>
        </div>
      </div>
    </div>
  );
};

export default FixOrgLink;

