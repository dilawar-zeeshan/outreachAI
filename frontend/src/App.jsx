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
import { BookOpen, LogOut, History, Zap, Target } from 'lucide-react';


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

    return () => subscription.unsubscribe();
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleBack = () => navigate('/');

  return (
    <Routes>
      <Route path="/" element={
        <ProtectedRoute session={session}>
          <div className="dashboard-wrapper">
            <div className="app-container">
              <header className="chat-header">
                <div className="header-left">
                  <h1>E-LABZ AI Outreach</h1>
                  <p>Private Assistant to Zeeshan</p>
                </div>
                <div className="header-actions">
                  <button onClick={() => navigate('/bulk')} className="btn-secondary flex-center" title="Bulk Outreach">
                    <Target className="icon-small" /> Bulk Outreach
                  </button>
                  <button onClick={() => navigate('/history')} className="btn-secondary flex-center" title="Outreach History">
                    <History className="icon-small" /> History
                  </button>
                  <button onClick={() => navigate('/knowledge')} className="btn-secondary flex-center" title="Update Knowledge Base">
                    <BookOpen className="icon-small tooltip-icon" /> Knowledge Base
                  </button>
                  <button onClick={handleLogout} className="btn-danger flex-center" title="Sign Out">
                    <LogOut className="icon-small" /> Sign Out
                  </button>
                </div>
              </header>

              <ChatWindow messages={messages} setMessages={setMessages} />

              <div className="chat-input-container">
                <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
              </div>
            </div>
          </div>
        </ProtectedRoute>
      } />

      <Route path="/bulk" element={
        <ProtectedRoute session={session}>
          <div className="dashboard-wrapper">
            <BulkOutreach onBack={handleBack} messages={messages} />
          </div>
        </ProtectedRoute>
      } />

      <Route path="/history" element={
        <ProtectedRoute session={session}>
          <div className="dashboard-wrapper">
            <OutreachHistory onBack={handleBack} />
          </div>
        </ProtectedRoute>
      } />

      <Route path="/knowledge" element={
        <ProtectedRoute session={session}>
          <div className="dashboard-wrapper">
            <KnowledgeBase onBack={handleBack} />
          </div>
        </ProtectedRoute>
      } />

      <Route path="/portfolio" element={<PortfolioPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
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
