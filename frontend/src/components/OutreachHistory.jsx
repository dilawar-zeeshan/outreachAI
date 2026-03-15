import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Mail, Calendar, Tag, RotateCcw, Loader2, CheckCircle, AlertCircle, Search, Play } from 'lucide-react';
import { getEmailHistory, sendEmail, processQueue } from '../services/api';

const OutreachHistory = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
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
    
    // Auto-refresh every 30 seconds to show background progress
    const interval = setInterval(() => {
        fetchHistory();
    }, 30000);

    return () => clearInterval(interval);
  }, [page, debouncedSearch, activeStatus]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getEmailHistory(page, limit, debouncedSearch, activeStatus);
      setEmails(data.emails || []);
      setTotalCount(data.totalCount || 0);
      setPendingCount(data.pendingCount || 0);
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
      <div className="kb-header" style={{ gap: '2rem', justifyContent: 'flex-start' }}>
         <h2>Outreach History</h2>
         
         <div style={{ display: 'flex', gap: '0.25rem', padding: '0.2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <button 
              onClick={() => { setActiveStatus('sent'); setPage(0); }}
              className="flex-center"
              style={{ 
                padding: '0.4rem 1rem', 
                background: activeStatus === 'sent' ? 'var(--primary)' : 'transparent', 
                border: 'none', 
                color: activeStatus === 'sent' ? '#fff' : '#8b949e',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s',
                fontSize: '0.85rem'
              }}
            >
              <RotateCcw size={14} /> Sent
            </button>
            <button 
              onClick={() => { setActiveStatus('pending'); setPage(0); }}
              className="flex-center"
              style={{ 
                padding: '0.4rem 1rem', 
                background: activeStatus === 'pending' ? 'var(--primary)' : 'transparent', 
                border: 'none', 
                color: activeStatus === 'pending' ? '#fff' : '#8b949e',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s',
                fontSize: '0.85rem'
              }}
            >
              <Play size={14} /> Pending
              {activeStatus === 'sent' && pendingCount > 0 && (
                  <span style={{ fontSize: '0.65rem', background: '#f85149', color: '#fff', padding: '1px 5px', borderRadius: '10px', marginLeft: '4px' }}>
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
              )}
            </button>
         </div>
      </div>

      <div className="kb-content">


        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1 }}>
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
          <div className="loading-state">
            {activeStatus === 'pending' ? (
              <>
                <Search className="icon text-dim" style={{ opacity: 0.3, width: '40px', height: '40px' }} />
                <span>The pending queue is empty. Ready for more bulk outreach!</span>
              </>
            ) : (
              <>
                <Mail className="icon text-dim" style={{ opacity: 0.3, width: '40px', height: '40px' }} />
                <span>No sent history found yet.</span>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="history-list">
              {emails.filter(e => e.status === activeStatus).map((email) => (
                <div key={email.id} className={`history-item ${email.status}`}>
                  <div className="history-content-row">
                    <div className="history-cell email-cell">
                      <Mail className="icon-small text-dim hide-mobile" />
                      <span className="history-email" title={email.email}>{email.email}</span>
                    </div>
                    
                    <div className="history-cell niche-cell">
                      <Tag className="icon-small text-dim hide-mobile" />
                      <span className="history-niche">{email.company_name || 'Manual'}</span>
                    </div>

                    <div className="history-cell date-cell">
                      <Calendar className="icon-small text-dim hide-mobile" />
                      <span className="history-date">
                        {new Date(email.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="history-cell status-cell">
                      <div className={`status-badge ${email.status}`}>
                        {email.status}
                      </div>
                    </div>
                  </div>

                  {activeStatus === 'sent' && (
                    <button 
                        onClick={() => handleResend(email)}
                        disabled={resendingId === email.id}
                        className="btn-secondary flex-center resend-btn"
                        style={{ height: '36px', padding: '0 1rem' }}
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
