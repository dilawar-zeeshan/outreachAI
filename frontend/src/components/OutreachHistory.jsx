import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Mail, Calendar, Tag } from 'lucide-react';
import { getEmailHistory } from '../services/api';

const OutreachHistory = ({ onBack }) => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getEmailHistory(page, limit);
      setEmails(data.emails || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
        {loading ? (
          <div className="loading-state">Loading history...</div>
        ) : emails.length === 0 ? (
          <div className="loading-state">No emails sent yet.</div>
        ) : (
          <>
            <div className="history-list">
              {emails.map((email) => (
                <div key={email.id} className="history-item">
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
