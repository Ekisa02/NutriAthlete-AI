import React, { useState } from 'react';
import { useAppContext } from './contexts/AppContext';
import ProfileForm from './components/ProfileForm';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import LandingPage from './components/LandingPage';

const App: React.FC = () => {
  const { userProfile } = useAppContext();
  const [showProfileForm, setShowProfileForm] = useState(false);

  const handleGetStarted = () => {
    setShowProfileForm(true);
  };

  return (
    <div className="min-h-screen bg-base-100 font-sans">
      <Header />
      <main className="p-4 sm:p-6 md:p-8">
        {userProfile ? (
          <Dashboard />
        ) : showProfileForm ? (
          <ProfileForm />
        ) : (
          <LandingPage onGetStarted={handleGetStarted} />
        )}
      </main>
       <footer className="text-center p-4 text-xs text-base-300 mt-8">
          OptiFuel &copy; 2024. All rights reserved.
      </footer>
    </div>
  );
};

export default App;
