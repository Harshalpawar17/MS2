
import React from 'react';
import { User, UserRole } from '../types';
import { Bell, Clock, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, FileText } from 'lucide-react';
import { MOCK_SUBMISSIONS, MOCK_CLAIMS } from '../constants';

interface PatientDashboardProps {
  user: User;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({ user }) => {
  // Filter submissions specific to this patient
  const mySubmissions = MOCK_SUBMISSIONS.filter(s => s.patientName === user.name);
  const myCases = MOCK_CLAIMS.filter(c => c.patient_name === user.name);

  const notifications = mySubmissions.map(s => ({
    id: s.id,
    title: `${s.workflow} Update`,
    message: `Your clinic, ${s.clinicName || 'assigned clinic'}, has ${s.status === 'Pending' ? 'created' : 'updated'} a ${s.workflow} request for your ${s.carrier} coverage.`,
    status: s.status,
    date: s.dateSubmitted,
    ref: s.refNumber
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-primaryText tracking-tight">Patient Portal</h1>
          <p className="text-secondary mt-2 text-lg font-medium">Hello, {user.name}. Here are the latest updates from your healthcare providers.</p>
        </div>
        <div className="bg-primary/10 px-6 py-3 rounded-2xl flex items-center space-x-3 text-primary">
          <ShieldCheck size={24} />
          <span className="font-bold">Secure Access Verified</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
            <h2 className="text-2xl font-bold text-primaryText flex items-center space-x-3">
              <Bell className="text-primary" size={24} />
              <span>Activity Stream</span>
            </h2>

            <div className="space-y-4">
              {notifications.length > 0 ? notifications.map((note) => (
                <div key={note.id} className="p-6 bg-gray-50 rounded-[32px] border border-transparent hover:border-primary/20 transition-all group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-5">
                      <div className={`mt-1 w-12 h-12 rounded-2xl flex items-center justify-center ${
                        note.status === 'Completed' ? 'bg-green-100 text-green-600' 
                        : note.status === 'Action Required' ? 'bg-red-100 text-red-600' 
                        : 'bg-blue-100 text-blue-600'
                      }`}>
                        {note.status === 'Completed' ? <CheckCircle2 size={24} /> 
                        : note.status === 'Action Required' ? <AlertCircle size={24} /> 
                        : <Clock size={24} />}
                      </div>
                      <div>
                        <h3 className="font-bold text-primaryText text-lg">{note.title}</h3>
                        <p className="text-secondary font-medium mt-1 leading-relaxed">{note.message}</p>
                        <div className="flex items-center space-x-4 mt-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ref: {note.ref}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{note.date}</span>
                        </div>
                      </div>
                    </div>
                    <button className="p-2 text-gray-300 group-hover:text-primary transition-colors">
                      <ArrowRight size={24} />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center text-gray-400 font-medium">
                  No recent activity found for your records.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-primaryText flex items-center space-x-2">
              <FileText className="text-accent" size={20} />
              <span>Active Cases</span>
            </h3>
            <div className="space-y-4">
              {myCases.length > 0 ? myCases.map(c => (
                <div key={c.claim_id} className="p-5 border border-gray-100 rounded-3xl hover:bg-accent/[0.02] transition-colors cursor-pointer">
                  <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">{c.claim_type}</p>
                  <p className="font-bold text-primaryText mt-1">{c.insurer_or_third_party}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs font-bold text-gray-400">Status</span>
                    <span className="text-xs font-black text-accent uppercase tracking-widest">{c.status}</span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-400 italic">No active PI or WC cases.</p>
              )}
            </div>
          </section>

          <section className="bg-gradient-to-br from-primary to-primary/80 p-8 rounded-[40px] text-white shadow-xl shadow-primary/20">
            <h3 className="font-black text-xl mb-4 tracking-tight">Need help?</h3>
            <p className="text-white/90 font-medium text-sm leading-relaxed mb-6">
              If you have questions about your benefits or status, contact your primary clinic representative directly through the portal.
            </p>
            <button className="w-full py-4 bg-white text-primary rounded-2xl font-bold hover:bg-gray-50 transition-colors">
              Message Clinic
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
