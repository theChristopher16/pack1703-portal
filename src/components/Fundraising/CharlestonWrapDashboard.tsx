import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  Target,
  TrendingUp,
  Calendar,
  ShoppingBag,
  RefreshCw,
  Award,
  Phone,
  Mail,
  Clock,
  Users,
} from 'lucide-react';
import {
  FundraisingService,
  CharlestonWrapData,
  FundraisingProgress,
} from '../../services/fundraisingService';
import { useAdmin } from '../../contexts/AdminContext';

export const CharlestonWrapDashboard: React.FC = () => {
  const { state } = useAdmin();
  const currentUser = state.currentUser;
  const userRole = state.currentUser?.role;
  const [fundraisingData, setFundraisingData] = useState<CharlestonWrapData | null>(null);
  const [progress, setProgress] = useState<FundraisingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to fundraising data
    const unsubscribe = FundraisingService.subscribeFundraising((data) => {
      setFundraisingData(data);
      if (data) {
        setProgress(FundraisingService.calculateProgress(data));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    const isAdmin = userRole === 'root' || userRole === 'super-admin' || userRole === 'content-admin';
    if (!isAdmin) {
      setError('Only admins can manually sync fundraising data');
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      const result = await FundraisingService.manualSync();
      if (result.success) {
        // Data will update via subscription
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to sync fundraising data');
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto text-primary-600 mb-4" />
          <p className="text-gray-600">Loading fundraising data...</p>
        </div>
      </div>
    );
  }

  if (!fundraisingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Calendar className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">
                No Active Fundraiser
              </h3>
              <p className="text-yellow-800 mb-4">
                There is no active fundraising campaign at this time. Data will appear
                here when a campaign is running.
              </p>
              {(userRole === 'root' || userRole === 'super-admin' || userRole === 'content-admin') && (
                <button
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="btn-primary"
                >
                  {syncing ? 'Syncing...' : 'Check for Data'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const urgency = FundraisingService.getUrgencyLevel(fundraisingData.daysRemaining);
  const progressColor = FundraisingService.getProgressColor(
    progress?.percentageToGoal || 0
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">
            {fundraisingData.organizationName}
          </h1>
          {(userRole === 'root' || userRole === 'super-admin' || userRole === 'content-admin') && (
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          )}
        </div>
        <p className="text-gray-600">{fundraisingData.campaign}</p>
        {fundraisingData.lastUpdated && (
          <p className="text-sm text-gray-500 mt-1">
            Last updated:{' '}
            {new Date(fundraisingData.lastUpdated.toDate()).toLocaleString()}
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Sales */}
        <StatCard
          icon={<DollarSign className="w-6 h-6" />}
          label="Total Sales"
          value={FundraisingService.formatCurrency(fundraisingData.totalRetail)}
          color="blue"
        />

        {/* Total Profit */}
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Total Profit"
          value={FundraisingService.formatCurrency(fundraisingData.totalProfit)}
          color="green"
        />

        {/* Items Sold */}
        <StatCard
          icon={<ShoppingBag className="w-6 h-6" />}
          label="Items Sold"
          value={fundraisingData.totalItemsSold.toString()}
          color="purple"
        />

        {/* Days Remaining */}
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          label="Days Remaining"
          value={fundraisingData.daysRemaining.toString()}
          color={urgency === 'critical' ? 'red' : urgency === 'high' ? 'orange' : 'blue'}
          subtitle={`Ends ${fundraisingData.saleEndDate}`}
        />
      </div>

      {/* Goal Progress */}
      {progress && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-semibold">Fundraising Goal</h2>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: progressColor }}>
                {FundraisingService.formatPercent(progress.percentageToGoal)}
              </p>
              <p className="text-sm text-gray-600">
                {FundraisingService.formatCurrency(fundraisingData.totalProfit)} of{' '}
                {FundraisingService.formatCurrency(fundraisingData.fundraisingGoal)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full transition-all duration-500 ease-out rounded-full"
              style={{
                width: `${Math.min(100, progress.percentageToGoal)}%`,
                backgroundColor: progressColor,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-900">
                {FundraisingService.formatCurrency(progress.amountRemaining)} to go
              </span>
            </div>
          </div>

          {/* Goal Statement */}
          {fundraisingData.goalStatement && (
            <div className="mt-4 p-4 bg-primary-50 rounded-lg">
              <p className="text-primary-900">{fundraisingData.goalStatement}</p>
            </div>
          )}

          {/* Projection */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Time Elapsed</p>
              <p className="text-lg font-semibold">
                {FundraisingService.formatPercent(progress.daysPercentageComplete)}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Projected Total</p>
              <p className="text-lg font-semibold">
                {FundraisingService.formatCurrency(progress.projectedTotal)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contact Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sales Rep Card */}
        <ContactCard
          title="Sales Representative"
          name={fundraisingData.salesRep.name}
          phone={fundraisingData.salesRep.phone}
          email={fundraisingData.salesRep.email}
          icon={<Award className="w-6 h-6 text-blue-600" />}
        />

        {/* Chairperson Card */}
        <ContactCard
          title="Campaign Chairperson"
          name={fundraisingData.chairperson.name}
          phone={fundraisingData.chairperson.phone}
          email={fundraisingData.chairperson.email}
          icon={<Users className="w-6 h-6 text-green-600" />}
        />
      </div>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'blue' | 'green' | 'purple' | 'red' | 'orange';
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className={`inline-flex p-3 rounded-lg ${colorClasses[color]} mb-4`}>
        {icon}
      </div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
};

// Contact Card Component
interface ContactCardProps {
  title: string;
  name: string;
  phone: string;
  email: string;
  icon: React.ReactNode;
}

const ContactCard: React.FC<ContactCardProps> = ({
  title,
  name,
  phone,
  email,
  icon,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-600">Name</p>
          <p className="font-medium">{name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-gray-400" />
          <a href={`tel:${phone}`} className="text-primary-600 hover:underline">
            {phone}
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <a href={`mailto:${email}`} className="text-primary-600 hover:underline">
            {email}
          </a>
        </div>
      </div>
    </div>
  );
};

