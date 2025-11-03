import React, { useState } from 'react';
import {
  QrCode,
  Mail,
  Share2,
  Zap,
  Users,
  FileText,
  Calendar,
  Package,
  Award,
  Send,
  Copy,
  Download,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { CharlestonWrapData } from '../../services/fundraisingService';

interface FundraisingToolkitProps {
  data: CharlestonWrapData;
}

export const FundraisingToolkit: React.FC<FundraisingToolkitProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'promo' | 'communications' | 'resources'>('promo');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(data.tools.directShoppingLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleDownloadQR = () => {
    if (data.tools.qrCodeUrl) {
      window.open(data.tools.qrCodeUrl, '_blank');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-8">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Award className="w-6 h-6 text-primary-600" />
        Fundraising Toolkit
      </h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('promo')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'promo'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Zap className="w-4 h-4 inline mr-2" />
          Promo Tools
        </button>
        <button
          onClick={() => setActiveTab('communications')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'communications'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Mail className="w-4 h-4 inline mr-2" />
          Communications
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'resources'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Resources
        </button>
      </div>

      {/* Promo Tools Tab */}
      {activeTab === 'promo' && (
        <div className="space-y-6">
          {/* Direct Shopping Link & QR Code */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
            <div className="flex items-start gap-4">
              <QrCode className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Direct Shopping Link & QR Code</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Share this link with supporters to shop directly and support the pack!
                </p>
                
                {/* Link Display */}
                <div className="bg-white rounded-lg p-3 mb-3 border border-gray-300">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={data.tools.directShoppingLink}
                      readOnly
                      className="flex-1 bg-transparent text-sm text-gray-700 focus:outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      {copySuccess ? (
                        <>✓ Copied!</>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* QR Code */}
                {data.tools.qrCodeUrl && (
                  <div className="flex gap-4">
                    <div className="bg-white p-3 rounded-lg border border-gray-300">
                      <img 
                        src={data.tools.qrCodeUrl} 
                        alt="QR Code for Direct Shopping" 
                        className="w-32 h-32"
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <p className="text-sm text-gray-600 mb-2">
                        Supporters can scan this QR code to shop instantly
                      </p>
                      <button
                        onClick={handleDownloadQR}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download QR Code
                      </button>
                    </div>
                  </div>
                )}

                {/* Caution Message */}
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> Orders through this link support the organization as a whole.
                    For individual participant credit, use the Participant Invite Tracker.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Promo Tools Grid */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Promo Tools</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PromoToolCard
                icon={<Mail className="w-5 h-5" />}
                title={data.promoTools.emailBank || 'Email Bank'}
                description="Pre-written email templates to share with your network"
                color="blue"
              />
              <PromoToolCard
                icon={<Share2 className="w-5 h-5" />}
                title={data.promoTools.socialMediaBank || 'Social Media Bank'}
                description="Ready-to-post social media content and graphics"
                color="purple"
              />
              <PromoToolCard
                icon={<Zap className="w-5 h-5" />}
                title={data.promoTools.challenge24Hour || '24-Hour Challenge'}
                description="Boost sales with a 24-hour challenge campaign"
                color="orange"
              />
              <PromoToolCard
                icon={<Zap className="w-5 h-5" />}
                title={data.promoTools.finalCountdownChallenge || 'Final Countdown Challenge'}
                description="Last-minute push to reach your fundraising goal"
                color="red"
              />
            </div>
          </div>

          {/* Participation Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <StatBox
              label="Total Enrolled"
              value={data.totalEnrolled}
              icon={<Users className="w-5 h-5 text-blue-600" />}
            />
            <StatBox
              label="Active Participants"
              value={data.totalParticipants}
              icon={<Users className="w-5 h-5 text-green-600" />}
            />
            <StatBox
              label="Participation Rate"
              value={`${data.participationRate.toFixed(1)}%`}
              icon={<Users className="w-5 h-5 text-purple-600" />}
            />
          </div>
        </div>
      )}

      {/* Communications Tab */}
      {activeTab === 'communications' && (
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">
            Use these pre-built email templates to communicate with families throughout the campaign
          </p>
          
          <CommunicationCard
            icon={<Send className="w-5 h-5" />}
            title={data.communications.saveDatesAnnouncement || 'Save the Dates Announcement'}
            description="Announce the fundraiser start date to build anticipation"
            step="STEP 2"
            color="blue"
          />
          <CommunicationCard
            icon={<Send className="w-5 h-5" />}
            title={data.communications.kickoffAnnouncement || 'Kick-off Announcement'}
            description="Launch the campaign with excitement and clear instructions"
            step="STEP 3"
            color="green"
          />
          <CommunicationCard
            icon={<MessageSquare className="w-5 h-5" />}
            title={data.communications.reminders || 'Campaign Reminders'}
            description="Keep momentum with mid-campaign reminder emails"
            step="STEP 5"
            color="yellow"
          />
          <CommunicationCard
            icon={<MessageSquare className="w-5 h-5" />}
            title={data.communications.finalReminders || 'Final Reminders'}
            description="Last call to participate before the campaign ends"
            step="STEP 7"
            color="red"
          />
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">
            Access campaign resources, tracking tools, and administrative materials
          </p>
          
          <ResourceCard
            icon={<Users className="w-5 h-5" />}
            title={data.tools.participantInviteTracker || 'Participant Invite Tracker'}
            description="Track participant sign-ups and monitor engagement"
          />
          <ResourceCard
            icon={<FileText className="w-5 h-5" />}
            title={data.tools.marketingGuide || 'Marketing Guide & Templates'}
            description="Professional marketing materials and promotional guides"
          />
          <ResourceCard
            icon={<FileText className="w-5 h-5" />}
            title={data.tools.reports || 'Campaign Reports'}
            description="Detailed sales reports and performance analytics"
          />
          <ResourceCard
            icon={<Calendar className="w-5 h-5" />}
            title={data.tools.campaignDates || 'Campaign Dates & Shipping Info'}
            description="Important dates, deadlines, and shipping schedules"
          />
          <ResourceCard
            icon={<Package className="w-5 h-5" />}
            title={data.tools.paperworkBox || 'Paperwork Box & Resources'}
            description="Forms, contracts, and administrative documents"
          />
          <ResourceCard
            icon={<Award className="w-5 h-5" />}
            title={data.tools.customPrizeTickets || 'Custom Prize Drawing Tickets'}
            description="Generate custom raffle tickets for incentives"
          />
        </div>
      )}
    </div>
  );
};

// Promo Tool Card Component
interface PromoToolCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'blue' | 'purple' | 'orange' | 'red';
}

const PromoToolCard: React.FC<PromoToolCardProps> = ({ icon, title, description, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${colorClasses[color]} cursor-pointer hover:shadow-lg transition-all`}>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white rounded-lg">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold mb-1">{title}</h4>
          <p className="text-sm opacity-90">{description}</p>
          <div className="mt-2">
            <span className="text-xs font-medium">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Communication Card Component
interface CommunicationCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  step: string;
  color: 'blue' | 'green' | 'yellow' | 'red';
}

const CommunicationCard: React.FC<CommunicationCardProps> = ({ icon, title, description, step, color }) => {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
  };

  return (
    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className={`p-3 ${colorClasses[color]} text-white rounded-lg`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-gray-500">{step}</span>
          <h4 className="font-semibold text-gray-900">{title}</h4>
        </div>
        <p className="text-sm text-gray-600">{description}</p>
        <button className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
          <ExternalLink className="w-4 h-4" />
          Access Template (Coming Soon)
        </button>
      </div>
    </div>
  );
};

// Resource Card Component
interface ResourceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ icon, title, description }) => {
  return (
    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
      <div className="p-3 bg-primary-600 text-white rounded-lg">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
        <button className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
          <ExternalLink className="w-4 h-4" />
          Access Resource (Coming Soon)
        </button>
      </div>
    </div>
  );
};

// Stat Box Component
interface StatBoxProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}

const StatBox: React.FC<StatBoxProps> = ({ label, value, icon }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
};

