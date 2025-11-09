
import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { UserProfile, SportType } from '../types';
import { useLocalization } from '../hooks/useLocalization';
import { SPORT_OPTIONS, GENDER_OPTIONS } from '../constants';

const ProfileForm: React.FC = () => {
  const { setUserProfile } = useAppContext();
  const { t } = useLocalization();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: '',
    age: undefined,
    gender: undefined,
    geographicalArea: '',
    height: undefined,
    weight: undefined,
    sport: undefined,
    subscription: 'Basic', // Default to Basic
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : Number(value) }));
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple validation
    if (formData.name && formData.age && formData.gender && formData.height && formData.weight && formData.sport) {
        setUserProfile(formData as UserProfile);
    } else {
        alert("Please fill all fields before submitting.");
    }
  };
  
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <h3 className="text-lg font-medium text-center text-content-100 mb-4">{t('step')} 1 {t('of')} 3 - Personal Info</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-content-200">{t('fullName')}</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" required />
              </div>
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-content-200">{t('age')}</label>
                <input type="number" name="age" id="age" value={formData.age || ''} onChange={handleNumericChange} className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" required />
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-content-200">{t('gender')}</label>
                <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" required>
                  <option value="">{t('selectGender')}</option>
                  {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <h3 className="text-lg font-medium text-center text-content-100 mb-4">{t('step')} 2 {t('of')} 3 - Biometrics</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="height" className="block text-sm font-medium text-content-200">{t('height')}</label>
                <input type="number" name="height" id="height" value={formData.height || ''} onChange={handleNumericChange} className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" required />
              </div>
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-content-200">{t('weight')}</label>
                <input type="number" name="weight" id="weight" value={formData.weight || ''} onChange={handleNumericChange} className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" required />
              </div>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <h3 className="text-lg font-medium text-center text-content-100 mb-4">{t('step')} 3 {t('of')} 3 - Sport Details</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="geographicalArea" className="block text-sm font-medium text-content-200">{t('geographicalArea')}</label>
                <input type="text" name="geographicalArea" id="geographicalArea" value={formData.geographicalArea} onChange={handleChange} className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" required />
              </div>
              <div>
                <label htmlFor="sport" className="block text-sm font-medium text-content-200">{t('primarySport')}</label>
                <select name="sport" id="sport" value={formData.sport} onChange={handleChange} className="mt-1 block w-full bg-base-200 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" required>
                  <option value="">{t('selectSport')}</option>
                  {SPORT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-base-200 rounded-xl shadow-2xl p-6 md:p-8">
        <h2 className="text-2xl font-bold text-center text-brand-primary mb-2">{t('getStarted')}</h2>
        <p className="text-center text-content-200 mb-6">{t('createProfile')}</p>
        <form onSubmit={handleSubmit}>
          {renderStep()}
          <div className="mt-8 flex justify-between">
            {step > 1 && <button type="button" onClick={prevStep} className="bg-base-300 text-content-100 py-2 px-4 rounded-md hover:bg-gray-500 transition-colors">{t('back')}</button>}
            {step < 3 && <button type="button" onClick={nextStep} className="bg-brand-primary text-white py-2 px-4 rounded-md hover:bg-brand-secondary transition-colors ml-auto">{t('next')}</button>}
            {step === 3 && <button type="submit" className="bg-brand-primary text-white py-2 px-4 rounded-md hover:bg-brand-secondary transition-colors ml-auto">{t('submit')}</button>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileForm;
   