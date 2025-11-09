
import React from 'react';
import { useAppContext } from './contexts/AppContext';
import ProfileForm from './components/ProfileForm';
import Dashboard from './components/Dashboard';
import Header from './components/Header';

const App: React.FC = () => {
  const { userProfile } = useAppContext();

  return (
    <div className="min-h-screen bg-base-100 font-sans">
      <Header />
      <main className="p-4 sm:p-6 md:p-8">
        {userProfile ? <Dashboard /> : <ProfileForm />}
      </main>
       <footer className="text-center p-4 text-xs text-base-300 mt-8">
          NutriAthlete AI &copy; 2024. All rights reserved.
      </footer>
    </div>
  );
};

export default App;
   