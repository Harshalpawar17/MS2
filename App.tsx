
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole } from './types';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import Layout from './components/Layout';
import IntakeSelection from './views/IntakeSelection';
import EligibilityVerificationView from './views/EligibilityVerificationView';
import PriorAuthorizationView from './views/PriorAuthorizationView';
import PersonalInjuryView from './views/PersonalInjuryView';
import UploadDocumentView from './views/UploadDocumentView';
import MySubmissionsView from './views/MySubmissionsView';
import AdminDashboard from './views/AdminDashboard';
import AddClinicView from './views/AddClinicView';
import PatientIntakeView from './views/PatientIntakeView';
import WCPIClaimsListingView from './views/WCPIClaimsListingView';
import EVClaimListingView from './views/EVClaimListingView';
import EVDetailPage from './views/EVDetailPage';
import PatientDashboard from './views/PatientDashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('medflow_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('medflow_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('medflow_user');
  };

  // Check if we are in the "public" patient portal view
  const isPatientPortal = window.location.hash.includes('/public/intake');

  if (!user && !isPatientPortal) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/public/intake" element={<PatientIntakeView />} />
        
        <Route path="/" element={<Layout user={user!} onLogout={handleLogout} />}>
          <Route index element={
            user?.role === UserRole.ADMIN ? <AdminDashboard /> 
            : user?.role === UserRole.PATIENT ? <PatientDashboard user={user!} />
            : <Dashboard role={user?.role!} />
          } />
          <Route path="intake" element={<IntakeSelection />} />
          <Route path="intake/ev" element={<EligibilityVerificationView />} />
          <Route path="intake/pa" element={<PriorAuthorizationView />} />
          <Route path="intake/pi" element={<PersonalInjuryView />} />
          <Route path="intake/upload" element={<UploadDocumentView />} />
          <Route path="submissions" element={<MySubmissionsView />} />
          <Route path="claims" element={<WCPIClaimsListingView userRole={user?.role!} />} />
          <Route path="ev-claims" element={<EVClaimListingView />} />
          <Route path="ev-claims/:id" element={<EVDetailPage />} />
          <Route path="admin/add-clinic" element={<AddClinicView />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
