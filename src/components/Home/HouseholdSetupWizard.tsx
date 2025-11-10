import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Users,
  DoorOpen,
  Car,
  PawPrint,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import householdService from '../../services/householdService';
import { DEFAULT_ROOMS, Room } from '../../types/household';
import { useToast } from '../../contexts/ToastContext';

interface HouseholdSetupWizardProps {
  onComplete: () => void;
}

const HouseholdSetupWizard: React.FC<HouseholdSetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    householdName: '',
    address: '',
    members: [{ name: '', relationship: 'self' }],
    rooms: DEFAULT_ROOMS.map((r) => ({ ...r, id: '' })),
    customRooms: [] as Omit<Room, 'id'>[],
    hasVehicles: false,
    hasPets: false,
    monthlyBudget: 0,
    useBudgetCategories: true,
  });
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();

  const totalSteps = 6;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Combine default and custom rooms
      const allRooms = [
        ...formData.rooms,
        ...formData.customRooms.map((r) => ({ ...r, id: '' })),
      ];

      await householdService.createHouseholdProfile({
        householdName: formData.householdName,
        address: formData.address || undefined,
        members: formData.members.filter((m) => m.name.trim() !== ''),
        rooms: allRooms,
        hasVehicles: formData.hasVehicles,
        hasPets: formData.hasPets,
        monthlyBudget: formData.monthlyBudget || undefined,
        useBudgetCategories: formData.useBudgetCategories,
      });

      showSuccess('Household setup complete!');
      onComplete();
    } catch (error: any) {
      showError('Failed to save household profile', error.message);
    } finally {
      setSaving(false);
    }
  };

  const stepConfig = [
    {
      title: 'Welcome to Your Home',
      icon: Home,
      color: 'from-green-500 to-blue-500',
    },
    {
      title: 'Who Lives Here?',
      icon: Users,
      color: 'from-blue-500 to-purple-500',
    },
    {
      title: 'Your Rooms',
      icon: DoorOpen,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Vehicles & Pets',
      icon: Car,
      color: 'from-pink-500 to-red-500',
    },
    {
      title: 'Budget Setup',
      icon: DollarSign,
      color: 'from-red-500 to-orange-500',
    },
    {
      title: 'All Set!',
      icon: CheckCircle,
      color: 'from-green-500 to-teal-500',
    },
  ];

  const currentStepConfig = stepConfig[step - 1];
  const StepIcon = currentStepConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${currentStepConfig.color} p-8 text-white`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
              <StepIcon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm opacity-90">Step {step} of {totalSteps}</p>
              <h2 className="text-3xl font-bold">{currentStepConfig.title}</h2>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 1 && <Step1_Welcome formData={formData} setFormData={setFormData} />}
              {step === 2 && <Step2_Members formData={formData} setFormData={setFormData} />}
              {step === 3 && <Step3_Rooms formData={formData} setFormData={setFormData} />}
              {step === 4 && <Step4_VehiclesPets formData={formData} setFormData={setFormData} />}
              {step === 5 && <Step5_Budget formData={formData} setFormData={setFormData} />}
              {step === 6 && <Step6_Complete formData={formData} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex justify-between">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>

            {step < totalSteps ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-8 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? 'Saving...' : 'Complete Setup'}
                <CheckCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Step 1: Welcome & Basic Info
const Step1_Welcome: React.FC<any> = ({ formData, setFormData }) => (
  <div className="space-y-6">
    <div className="text-center mb-8">
      <h3 className="text-2xl font-bold text-gray-800 mb-2">Let's Set Up Your Home</h3>
      <p className="text-gray-600">
        We'll help you get started by gathering some basic information about your household.
        This will help us tailor the features to your needs.
      </p>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        What would you like to call your household? *
      </label>
      <input
        type="text"
        required
        value={formData.householdName}
        onChange={(e) => setFormData({ ...formData, householdName: e.target.value })}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
        placeholder="e.g., Smith Family, My Home"
      />
      <p className="text-xs text-gray-500 mt-1">This is just for you - make it personal!</p>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Home Address (Optional)</label>
      <input
        type="text"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        placeholder="123 Main Street, City, State"
      />
    </div>
  </div>
);

// Step 2: Household Members
const Step2_Members: React.FC<any> = ({ formData, setFormData }) => {
  const addMember = () => {
    setFormData({
      ...formData,
      members: [...formData.members, { name: '', relationship: 'other' }],
    });
  };

  const removeMember = (index: number) => {
    setFormData({
      ...formData,
      members: formData.members.filter((_: any, i: number) => i !== index),
    });
  };

  const updateMember = (index: number, field: string, value: any) => {
    const newMembers = [...formData.members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setFormData({ ...formData, members: newMembers });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Who lives in your home?</h3>
        <p className="text-gray-600">Add family members to help organize schedules and responsibilities</p>
      </div>

      <div className="space-y-3">
        {formData.members.map((member: any, index: number) => (
          <div key={index} className="flex gap-3 items-start">
            <input
              type="text"
              value={member.name}
              onChange={(e) => updateMember(index, 'name', e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Name"
            />
            <select
              value={member.relationship}
              onChange={(e) => updateMember(index, 'relationship', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="self">Self</option>
              <option value="spouse">Spouse/Partner</option>
              <option value="child">Child</option>
              <option value="parent">Parent</option>
              <option value="other">Other</option>
            </select>
            {formData.members.length > 1 && (
              <button
                onClick={() => removeMember(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addMember}
        className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Add Another Person
      </button>
    </div>
  );
};

// Step 3: Rooms
const Step3_Rooms: React.FC<any> = ({ formData, setFormData }) => {
  const addCustomRoom = () => {
    setFormData({
      ...formData,
      customRooms: [...formData.customRooms, { name: '', type: 'other' as Room['type'] }],
    });
  };

  const removeCustomRoom = (index: number) => {
    setFormData({
      ...formData,
      customRooms: formData.customRooms.filter((_: any, i: number) => i !== index),
    });
  };

  const updateCustomRoom = (index: number, field: 'name' | 'type', value: string) => {
    const newRooms = [...formData.customRooms];
    newRooms[index] = { ...newRooms[index], [field]: value };
    setFormData({ ...formData, customRooms: newRooms });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">What rooms do you have?</h3>
        <p className="text-gray-600">
          We've suggested common rooms. Add or remove as needed for cleaning and inventory management.
        </p>
      </div>

      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Common Rooms (included by default)</h4>
        <div className="grid grid-cols-2 gap-3">
          {formData.rooms.map((room: any, index: number) => (
            <div key={index} className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg text-purple-800">
              {room.name}
            </div>
          ))}
        </div>
      </div>

      {formData.customRooms.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-700 mb-3">Your Custom Rooms</h4>
          <div className="space-y-2">
            {formData.customRooms.map((room: any, index: number) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={room.name}
                  onChange={(e) => updateCustomRoom(index, 'name', e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Room name"
                />
                <button
                  onClick={() => removeCustomRoom(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={addCustomRoom}
        className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-purple-500 hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Add Another Room
      </button>
    </div>
  );
};

// Step 4: Vehicles & Pets
const Step4_VehiclesPets: React.FC<any> = ({ formData, setFormData }) => (
  <div className="space-y-6">
    <div className="text-center mb-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-2">Do you have vehicles or pets?</h3>
      <p className="text-gray-600">This helps us show you relevant features</p>
    </div>

    <div className="space-y-4">
      <button
        onClick={() => setFormData({ ...formData, hasVehicles: !formData.hasVehicles })}
        className={`w-full p-6 rounded-xl border-2 transition-all ${
          formData.hasVehicles
            ? 'border-blue-500 bg-blue-50 shadow-md'
            : 'border-gray-300 bg-white hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Car className={`w-8 h-8 ${formData.hasVehicles ? 'text-blue-600' : 'text-gray-400'}`} />
            <div className="text-left">
              <h4 className={`font-semibold text-lg ${formData.hasVehicles ? 'text-blue-900' : 'text-gray-800'}`}>
                Vehicles
              </h4>
              <p className="text-sm text-gray-600">Track maintenance, registration, and expenses</p>
            </div>
          </div>
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              formData.hasVehicles ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
            }`}
          >
            {formData.hasVehicles && <CheckCircle className="w-5 h-5 text-white" />}
          </div>
        </div>
      </button>

      <button
        onClick={() => setFormData({ ...formData, hasPets: !formData.hasPets })}
        className={`w-full p-6 rounded-xl border-2 transition-all ${
          formData.hasPets
            ? 'border-pink-500 bg-pink-50 shadow-md'
            : 'border-gray-300 bg-white hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <PawPrint className={`w-8 h-8 ${formData.hasPets ? 'text-pink-600' : 'text-gray-400'}`} />
            <div className="text-left">
              <h4 className={`font-semibold text-lg ${formData.hasPets ? 'text-pink-900' : 'text-gray-800'}`}>
                Pets
              </h4>
              <p className="text-sm text-gray-600">Manage vet appointments, medications, and supplies</p>
            </div>
          </div>
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              formData.hasPets ? 'border-pink-500 bg-pink-500' : 'border-gray-300'
            }`}
          >
            {formData.hasPets && <CheckCircle className="w-5 h-5 text-white" />}
          </div>
        </div>
      </button>
    </div>
  </div>
);

// Step 5: Budget
const Step5_Budget: React.FC<any> = ({ formData, setFormData }) => (
  <div className="space-y-6">
    <div className="text-center mb-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-2">Set up your budget</h3>
      <p className="text-gray-600">Optional: Track your household expenses and stay on budget</p>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Monthly Budget (Optional)
      </label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
        <input
          type="number"
          min="0"
          step="100"
          value={formData.monthlyBudget || ''}
          onChange={(e) => setFormData({ ...formData, monthlyBudget: Number(e.target.value) })}
          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-lg"
          placeholder="0"
        />
      </div>
    </div>

    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-200">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.useBudgetCategories}
          onChange={(e) => setFormData({ ...formData, useBudgetCategories: e.target.checked })}
          className="mt-1 rounded text-orange-500 focus:ring-orange-500"
        />
        <div>
          <h4 className="font-semibold text-gray-800 mb-1">Use default budget categories</h4>
          <p className="text-sm text-gray-600 mb-2">
            We'll set up common categories like Groceries, Utilities, Transportation, etc.
          </p>
          <p className="text-xs text-gray-500">You can customize these later</p>
        </div>
      </label>
    </div>
  </div>
);

// Step 6: Complete
const Step6_Complete: React.FC<any> = ({ formData }) => (
  <div className="text-center space-y-6">
    <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto">
      <CheckCircle className="w-12 h-12 text-white" />
    </div>

    <div>
      <h3 className="text-2xl font-bold text-gray-800 mb-2">You're All Set!</h3>
      <p className="text-gray-600">Here's what we've set up for you:</p>
    </div>

    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 space-y-3 text-left">
      <div className="flex items-center gap-3">
        <Home className="w-5 h-5 text-blue-600" />
        <span className="text-gray-800">
          <strong>{formData.householdName}</strong>
          {formData.address && ` at ${formData.address}`}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Users className="w-5 h-5 text-purple-600" />
        <span className="text-gray-800">
          {formData.members.filter((m: any) => m.name).length} household member(s)
        </span>
      </div>

      <div className="flex items-center gap-3">
        <DoorOpen className="w-5 h-5 text-pink-600" />
        <span className="text-gray-800">
          {formData.rooms.length + formData.customRooms.length} room(s)
        </span>
      </div>

      {formData.hasVehicles && (
        <div className="flex items-center gap-3">
          <Car className="w-5 h-5 text-blue-600" />
          <span className="text-gray-800">Vehicle management enabled</span>
        </div>
      )}

      {formData.hasPets && (
        <div className="flex items-center gap-3">
          <PawPrint className="w-5 h-5 text-pink-600" />
          <span className="text-gray-800">Pet care enabled</span>
        </div>
      )}

      {formData.monthlyBudget > 0 && (
        <div className="flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-green-600" />
          <span className="text-gray-800">
            ${formData.monthlyBudget.toFixed(2)} monthly budget
          </span>
        </div>
      )}
    </div>

    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p className="text-sm text-blue-800">
        💡 You can always change these settings later in the Settings tab, or adjust which features
        are visible from the home management dashboard.
      </p>
    </div>
  </div>
);

export default HouseholdSetupWizard;

