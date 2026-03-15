import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import Login from './components/Login';
import KnowledgeBase from './components/KnowledgeBase';
import OutreachHistory from './components/OutreachHistory';
import BulkOutreach from './components/BulkOutreach';
import PortfolioPage from './pages/PortfolioPage';
import { sendChatMessage, supabase } from './services/api';
import { BookOpen, LogOut, History, Zap, Target, Trash2, MessageSquare, Layout } from 'lucide-react';


import { useNavigate, useLocation } from 'react-router-dom';

// Protected Route Wrapper Component
function ProtectedRoute({ session, children }) {
  if (!session) {
    return (
      <div className="dashboard-wrapper">
        <Login />
      </div>
    );
  }
  return children;
}

// Main AI Assistant Dashboard Component
function Dashboard() {
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem('e_labz_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    sessionStorage.setItem('e_labz_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_OUT') {
        sessionStorage.removeItem('e_labz_messages');
        setMessages([]);
      }
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSendMessage = async (text) => {
    const newMessages = [...messages, { text, isAi: false, isDraft: false }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const historyContext = messages
        .filter(m => !m.text.startsWith('Error:'))
        .slice(-6)
        .map(m => ({ 
          role: m.isAi ? 'model' : 'user', 
          parts: [{ text: m.text }] 
        }));

      const response = await sendChatMessage(text, historyContext);
      const msgs = [...newMessages];

      if (response.reply) {
        msgs.push({ text: response.reply, isAi: true, isDraft: false });
      }

      if (response.body) {
        msgs.push({
          text: response.body,
          isAi: true,
          isDraft: true,
          draftSent: false,
          subject: response.subject || 'Outreach Email',
          recipientEmail: response.recipient_email || null,
          niche: response.niche || 'Unknown'
        });
      }

      setMessages(msgs);
    } catch (error) {
      setMessages([...newMessages, { text: `Error: ${error.message}`, isAi: true, isDraft: false }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setShowClearConfirm(true);
  };

  const confirmClearChat = () => {
    setMessages([]);
    sessionStorage.removeItem('e_labz_messages');
    setShowClearConfirm(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const Sidebar = () => {
    const isActive = (path) => location.pathname === path;

    return (
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>E-LABZ AI</h1>
          <p>Outreach Engine</p>
        </div>
        
        <nav className="nav-menu">
          <button 
            onClick={() => navigate('/')} 
            className={`nav-item ${isActive('/') ? 'active' : ''}`}
          >
            <MessageSquare className="icon-small" />
            <span>Chat Assistant</span>
          </button>
          
          <button 
            onClick={() => navigate('/bulk')} 
            className={`nav-item ${isActive('/bulk') ? 'active' : ''}`}
          >
            <Target className="icon-small" />
            <span>Bulk Outreach</span>
          </button>
          
          <button 
            onClick={() => navigate('/history')} 
            className={`nav-item ${isActive('/history') ? 'active' : ''}`}
          >
            <History className="icon-small" />
            <span>History</span>
          </button>
          
          <button 
            onClick={() => navigate('/knowledge')} 
            className={`nav-item ${isActive('/knowledge') ? 'active' : ''}`}
          >
            <BookOpen className="icon-small" />
            <span>Knowledge Base</span>
          </button>

          <div className="mobile-only-spacer" style={{ flex: 1, display: 'none' }} />

          <button onClick={handleLogout} className="nav-item sign-out-nav">
            <LogOut className="icon-small" />
            <span>Sign Out</span>
          </button>
        </nav>
      </aside>
    );
  };

  const DashboardLayout = ({ children }) => (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );

  return (
    <>
    <Routes>
      <Route path="/" element={
        <ProtectedRoute session={session}>
          <DashboardLayout>
            <div className="app-container">
              <header className="chat-header">
                <div className="header-left">
                  <h1>Chat Assistant</h1>
                  <p>Private Assistant to Zeeshan</p>
                </div>
                <div className="header-actions">
                  <button onClick={handleClearChat} className="btn-secondary flex-center" style={{ color: '#f85149', borderColor: 'rgba(248, 81, 73, 0.2)' }}>
                    <Trash2 size={16} /> <span>Clear Chat</span>
                  </button>
                </div>
              </header>

              <ChatWindow messages={messages} setMessages={setMessages} />

              <div className="chat-input-container">
                <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
              </div>
            </div>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/bulk" element={
        <ProtectedRoute session={session}>
          <DashboardLayout>
            <BulkOutreach messages={messages} />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/history" element={
        <ProtectedRoute session={session}>
          <DashboardLayout>
            <OutreachHistory />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/knowledge" element={
        <ProtectedRoute session={session}>
          <DashboardLayout>
            <KnowledgeBase />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/portfolio" element={<PortfolioPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>

    {/* Clear Chat Confirmation Modal */}
    {showClearConfirm && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}>
        <div style={{
          background: 'var(--bg-color)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '2.5rem',
          maxWidth: '450px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          textAlign: 'center'
        }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            background: 'rgba(248, 81, 73, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            color: '#f85149'
          }}>
            <Trash2 size={32} />
          </div>
          <h2 style={{ marginBottom: '0.75rem', fontSize: '1.5rem', color: '#fff' }}>Clear Chat?</h2>
          <p style={{ color: '#8b949e', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Are you sure you want to clear all messages? This will also reset the AI context and save your input tokens.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => setShowClearConfirm(false)} 
              className="btn-secondary" 
              style={{ flex: 1, height: '48px', fontSize: '1rem' }}
            >
              Cancel
            </button>
            <button 
              onClick={confirmClearChat} 
              className="btn-primary" 
              style={{ flex: 1, height: '48px', backgroundColor: '#f85149', borderColor: '#f85149', fontSize: '1rem' }}
            >
              Clear Everything
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function App() {
  return (
    <Router>
      <Dashboard />
    </Router>
  );
}

export default App;
