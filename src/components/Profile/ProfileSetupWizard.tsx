import React, { useState } from 'react';
import { Users, UserPlus, Save, ChevronLeft, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { authService, AppUser } from '../../services/authService';

type ScoutEntry = {
  name: string;
  age: number;
  den?: string;
  isAdult?: boolean;
};

interface ProfileSetupWizardProps {
  user: AppUser;
  onComplete?: () => void;
}

const dens = ['Lion', 'Tiger', 'Wolf', 'Bear', 'Webelos', 'Arrow of Light'];

const ProfileSetupWizard: React.FC<ProfileSetupWizardProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [family, setFamily] = useState({
    firstName: user.profile?.firstName || '',
    lastName: user.profile?.lastName || '',
    phone: user.profile?.phone || '',
    parentNames: (user.profile?.parentNames || []) as string[]
  });

  const [scouts, setScouts] = useState<ScoutEntry[]>(
    (user.profile?.scouts as ScoutEntry[])?.map(s => ({
      name: (s as any).name || (s as any).scoutName || '',
      age: (s as any).age || 0,
      den: (s as any).den || '',
      isAdult: false
    })) || []
  );

  const addScout = () => setScouts(prev => ([...prev, { name: '', age: 0, den: '' }]));
  const removeScout = (index: number) => setScouts(prev => prev.filter((_, i) => i !== index));
  const updateScout = (index: number, field: keyof ScoutEntry, value: any) =>
    setScouts(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));

  const canNext = () => {
    if (step === 1) {
      return Boolean(family.firstName.trim() || family.lastName.trim() || family.phone.trim() || family.parentNames.length > 0);
    }
    if (step === 2) {
      return scouts.length === 0 || scouts.every(s => s.name.trim() && s.age >= 0 && s.age <= 120);
    }
    return true;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // Persist only known profile fields
      await authService.updateProfile({
        firstName: family.firstName,
        lastName: family.lastName,
        phone: family.phone,
        parentNames: family.parentNames,
        scouts: scouts.map(s => ({ 
          id: `scout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: s.name, 
          age: s.age, 
          scoutRank: s.den,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      });
      setSuccess('Profile saved successfully');
      setTimeout(() => {
        setSuccess(null);
        if (onComplete) onComplete();
      }, 1200);
    } catch (e: any) {
      setError(e?.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-cloud rounded-brand shadow-card p-6">
      <div className="flex items-center mb-4">
        <Users className="h-6 w-6 text-primary-600 mr-2" />
        <h3 className="text-xl font-semibold text-ink">Family Account Setup</h3>
      </div>
      <p className="text-sm text-teal-700 mb-4">Set up your family account. You can always edit this later.</p>

      {/* Steps */}
      <div className="flex items-center space-x-2 mb-6">
        <div className={`h-2 rounded-full ${step >= 1 ? 'bg-primary-500' : 'bg-gray-200'}`} style={{ width: '33%' }} />
        <div className={`h-2 rounded-full ${step >= 2 ? 'bg-primary-500' : 'bg-gray-200'}`} style={{ width: '33%' }} />
        <div className={`h-2 rounded-full ${step >= 3 ? 'bg-primary-500' : 'bg-gray-200'}`} style={{ width: '33%' }} />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />{error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center">
          <CheckCircle className="h-4 w-4 mr-2" />{success}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-ink">Parent/Guardian Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">First Name</label>
              <input className="input-rainbow" value={family.firstName} onChange={e => setFamily({ ...family, firstName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Last Name</label>
              <input className="input-rainbow" value={family.lastName} onChange={e => setFamily({ ...family, lastName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Phone</label>
              <input className="input-rainbow" value={family.phone} onChange={e => setFamily({ ...family, phone: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Parent/Guardian Names (optional)</label>
            <div className="space-y-2">
              {(family.parentNames || []).map((p, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input className="input-rainbow flex-1" value={p} onChange={e => {
                    const next = [...family.parentNames];
                    next[idx] = e.target.value;
                    setFamily({ ...family, parentNames: next });
                  }} />
                  <button type="button" className="text-red-600 text-sm" onClick={() => setFamily({ ...family, parentNames: family.parentNames.filter((_, i) => i !== idx) })}>Remove</button>
                </div>
              ))}
              <button type="button" className="px-3 py-2 bg-secondary-500 text-white rounded-lg text-sm" onClick={() => setFamily({ ...family, parentNames: [...(family.parentNames || []), ''] })}>
                Add Parent/Guardian
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center mb-2">
            <UserPlus className="h-5 w-5 text-primary-600 mr-2" />
            <h4 className="font-semibold text-ink">Add Scouts (optional)</h4>
          </div>
          <div className="space-y-3">
            {scouts.map((s, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input className="input-rainbow" placeholder="Scout name" value={s.name} onChange={e => updateScout(idx, 'name', e.target.value)} />
                  <input className="input-rainbow" placeholder="Age" type="number" min={0} max={120} value={s.age} onChange={e => updateScout(idx, 'age', parseInt(e.target.value) || 0)} />
                  <select className="input-rainbow" value={s.den || ''} onChange={e => updateScout(idx, 'den', e.target.value)}>
                    <option value="">Den</option>
                    {dens.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="mt-2 text-right">
                  <button type="button" className="text-red-600 text-sm" onClick={() => removeScout(idx)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addScout} className="px-3 py-2 bg-secondary-500 text-white rounded-lg text-sm">Add Scout</button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-ink">Review</h4>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-teal-800">
            <p><span className="font-medium">Parent:</span> {family.firstName} {family.lastName} {family.phone ? `• ${family.phone}` : ''}</p>
            {family.parentNames?.length ? <p><span className="font-medium">Guardians:</span> {family.parentNames.filter(Boolean).join(', ')}</p> : null}
            <p className="mt-2 font-medium">Scouts:</p>
            {scouts.length === 0 ? <p>None added</p> : (
              <ul className="list-disc list-inside">
                {scouts.map((s, i) => (
                  <li key={i}>{s.name} • Age {s.age}{s.den ? ` • ${s.den}` : ''}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button type="button" className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex items-center" onClick={() => setStep(prev => Math.max(1, prev - 1))} disabled={step === 1}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </button>
          <button type="button" className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex items-center" onClick={() => setStep(prev => Math.min(3, prev + 1))} disabled={!canNext() || step === 3}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
        <button type="button" onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center disabled:opacity-50">
          <Save className="h-4 w-4 mr-2" /> {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
};

export default ProfileSetupWizard;


