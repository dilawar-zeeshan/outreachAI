import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Mail, Calendar, Tag, RotateCcw, Loader2, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { getEmailHistory, sendEmail } from '../services/api';

const OutreachHistory = ({ onBack }) => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [message, setMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('sent');
  const limit = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchHistory();
  }, [page, debouncedSearch, activeStatus]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getEmailHistory(page, limit, debouncedSearch, activeStatus);
      setEmails(data.emails || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (emailObj) => {
    if (resendingId) return;
    
    setResendingId(emailObj.id);
    setMessage(null);
    
    try {
      await sendEmail(
        emailObj.email, 
        emailObj.email_subject || 'Outreach from E-LABZ AI', 
        emailObj.email_content, 
        emailObj.company_name
      );
      setMessage({ type: 'success', text: `Successfully resent to ${emailObj.email}` });
      // Refresh history to update status if needed
      fetchHistory();
    } catch (err) {
      setMessage({ type: 'error', text: `Failed to resend: ${err.message}` });
    } finally {
      setResendingId(null);
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="kb-container">
      <div className="kb-header">
         <button onClick={onBack} className="btn-icon" title="Back to Chat">
           <ArrowLeft className="icon" />
         </button>
         <h2>Outreach History</h2>
         <div style={{ width: '40px' }}></div> {/* Spacer */}
      </div>

      <div className="kb-content">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => { setActiveStatus('sent'); setPage(0); }}
              style={{ 
                padding: '0.75rem 1.5rem', 
                background: 'none', 
                border: 'none', 
                color: activeStatus === 'sent' ? 'var(--primary)' : '#8b949e',
                borderBottom: activeStatus === 'sent' ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              Sent History
            </button>
            <button 
              onClick={() => { setActiveStatus('pending'); setPage(0); }}
              style={{ 
                padding: '0.75rem 1.5rem', 
                background: 'none', 
                border: 'none', 
                color: activeStatus === 'pending' ? 'var(--primary)' : '#8b949e',
                borderBottom: activeStatus === 'pending' ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              Pending Queue
            </button>
        </div>

        <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Search by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="chat-input-field"
            style={{ width: '100%', paddingLeft: '2.5rem', height: '45px' }}
          />
          <Search className="icon-small text-dim" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        {message && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'}`} style={{ marginBottom: '1.5rem' }}>
            {message.type === 'success' ? <CheckCircle className="icon-small" /> : <AlertCircle className="icon-small" />}
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <Loader2 className="icon spin" /> Loading history...
          </div>
        ) : emails.length === 0 ? (
          <div className="loading-state">No emails sent yet.</div>
        ) : (
          <>
            <div className="history-list">
              {emails.map((email) => (
                <div key={email.id} className="history-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div className="history-info">
                      <div className="history-row">
                        <Mail className="icon-small text-dim" />
                        <span className="history-email">{email.email}</span>
                      </div>
                      <div className="history-row">
                        <Tag className="icon-small text-dim" />
                        <span className="history-niche">{email.company_name || 'Manual'}</span>
                      </div>
                    </div>
                    <div className="history-meta">
                      <div className="history-row">
                        <Calendar className="icon-small text-dim" />
                        <span className="history-date">
                          {new Date(email.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className={`status-badge ${email.status}`}>
                        {email.status}
                      </div>
                    </div>
                  </div>
                  
                  {activeStatus === 'sent' && (
                    <button 
                        onClick={() => handleResend(email)}
                        disabled={resendingId === email.id}
                        className="btn-secondary flex-center"
                        style={{ 
                            height: 'fit-content', 
                            padding: '0.5rem 1rem', 
                            gap: '0.4rem',
                            fontSize: '0.85rem'
                        }}
                        title="Resend same email"
                    >
                        {resendingId === email.id ? (
                            <><Loader2 className="icon-small spin" /> Sending</>
                        ) : (
                            <><RotateCcw className="icon-small" /> Resend</>
                        )}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  disabled={page === 0} 
                  onClick={() => setPage(p => p - 1)}
                  className="btn-icon"
                >
                  <ChevronLeft />
                </button>
                <span className="page-info">Page {page + 1} of {totalPages}</span>
                <button 
                  disabled={page >= totalPages - 1} 
                  onClick={() => setPage(p => p + 1)}
                  className="btn-icon"
                >
                  <ChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OutreachHistory;
