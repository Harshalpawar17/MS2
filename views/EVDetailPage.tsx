
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ShieldCheck, 
  Calendar, 
  Hash, 
  Building2, 
  Clock, 
  User, 
  FileText,
  Info,
  ExternalLink,
  History,
  Tag
} from 'lucide-react';
import { MOCK_EV_RECORDS } from '../constants';
import { EVRecord, EVStatus } from '../types';

const EVDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const record = useMemo(() => {
    return MOCK_EV_RECORDS.find(r => r.unique_id === id);
  }, [id]);

  if (!record) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-6">
        <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-red-500">
          <Info size={32} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Record Not Found</h1>
        <p className="text-gray-500">The Insurance Verification record you are looking for does not exist or has been removed.</p>
        <button 
          onClick={() => navigate('/ev-claims')}
          className="bg-primary text-white px-8 py-3 rounded-2xl font-bold shadow-lg"
        >
          Return to Listing
        </button>
      </div>
    );
  }

  const getStatusStyle = (status: EVStatus) => {
    switch (status) {
      case 'Pending': return 'bg-blue-100 text-blue-700';
      case 'Action Required': return 'bg-amber-100 text-amber-700';
      case 'Authorized': return 'bg-emerald-100 text-emerald-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Denied': return 'bg-red-100 text-red-700';
      case 'Closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/ev-claims')}
          className="flex items-center space-x-2 text-secondary hover:text-primary font-bold transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Back to EV Listing</span>
        </button>
        <div className="flex space-x-3">
          <button className="px-6 py-2 bg-white border border-gray-200 rounded-xl font-bold text-secondary hover:bg-gray-50 transition-colors">Print Details</button>
          <button className="px-6 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all">Actions</button>
        </div>
      </div>

      <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-12 space-y-12">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-gray-50 pb-10">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 p-2.5 rounded-2xl text-primary">
                  <ShieldCheck size={28} />
                </div>
                <h1 className="text-4xl font-extrabold text-primaryText tracking-tight">{record.unique_id}</h1>
              </div>
              <div className="flex items-center space-x-3 text-secondary font-bold">
                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${getStatusStyle(record.ev_status)}`}>
                  {record.ev_status}
                </span>
                <span className="text-gray-300">|</span>
                <div className="flex items-center space-x-2">
                  <Building2 size={18} className="text-primary" />
                  <span className="text-lg">{record.clinic_name}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-[32px] p-6 text-center border border-gray-100 min-w-[200px]">
              <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-1">Insurance Order</p>
              <p className="text-4xl font-black text-primaryText">{record.insurance_order === 1 ? 'Primary' : record.insurance_order === 2 ? 'Secondary' : record.insurance_order === 3 ? 'Tertiary' : `#${record.insurance_order}`}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* Left Column: EV Information */}
            <div className="space-y-8">
              <h3 className="text-[10px] font-bold text-secondary uppercase tracking-[0.3em] border-b border-gray-100 pb-3 flex items-center space-x-2">
                <FileText size={16} className="text-primary" />
                <span>EV Information</span>
              </h3>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-50 p-3 rounded-2xl text-primary"><Calendar size={20}/></div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Submitted Date</p>
                    <p className="font-bold text-primaryText text-lg">{record.submitted_date}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-50 p-3 rounded-2xl text-primary"><Clock size={20}/></div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Requested Back Date</p>
                    <p className="font-bold text-primaryText text-lg">{record.requested_back_date}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-50 p-3 rounded-2xl text-primary"><ExternalLink size={20}/></div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Insurance Payer Name</p>
                    <p className="font-bold text-primaryText text-lg">{record.insurance_name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-50 p-3 rounded-2xl text-primary"><Tag size={20}/></div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Related Policy IDs</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {record.metadata.related_policy_ids.map(pid => (
                        <span key={pid} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold text-primary">{pid}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Metadata Information */}
            <div className="space-y-8">
              <h3 className="text-[10px] font-bold text-secondary uppercase tracking-[0.3em] border-b border-gray-100 pb-3 flex items-center space-x-2">
                <History size={16} className="text-primary" />
                <span>Metadata & Audit Information</span>
              </h3>

              <div className="bg-gray-50 rounded-[32px] p-8 space-y-6">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Created By</p>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-[10px] text-primary font-bold">
                        {record.metadata.created_by.charAt(0)}
                      </div>
                      <p className="font-bold text-primaryText">{record.metadata.created_by}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Created At</p>
                    <p className="font-bold text-primaryText">{new Date(record.metadata.created_at).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Updated By</p>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center text-[10px] text-accent font-bold">
                        {record.metadata.last_updated_by.charAt(0)}
                      </div>
                      <p className="font-bold text-primaryText">{record.metadata.last_updated_by}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Updated At</p>
                    <p className="font-bold text-primaryText">{new Date(record.metadata.last_updated_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Case Notes / Internal Comments</p>
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 italic text-sm text-secondary leading-relaxed">
                    "{record.metadata.notes}"
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EVDetailPage;
