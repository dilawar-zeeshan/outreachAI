import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Mail, Building, Globe, MapPin, Send, Loader2, CheckCircle, AlertCircle, Download, Trash2, Edit2, Save, X, CheckSquare, Square, Filter, ChevronDown, Plus, Phone } from 'lucide-react';
import { Select } from 'antd';
import { Country, City } from 'country-state-city';
import { scrapeLeads, sendEmail, queueEmails, getTemplates, saveTemplate, deleteTemplate } from '../services/api';

const { Option } = Select;

export default function BulkOutreach({ onBack, messages }) {
  const [countryId, setCountryId] = useState('ES'); // Default to Spain
  const [cityId, setCityId] = useState('Madrid');
  const [keyword, setKeyword] = useState('');
  const [leads, setLeads] = useState([]);

  // Get data from CSC
  const countries = Country.getAllCountries();
  const cities = countryId ? City.getCitiesOfCountry(countryId) : [];
  
  // Find current country and city objects for human readable names
  const currentCountry = countries.find(c => c.isoCode === countryId);
  const countryName = currentCountry?.name || countryId;
  const cityName = cityId;
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [isScraping, setIsScraping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState(null);
  const [successCount, setSuccessCount] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'manual'
  const [manualEmails, setManualEmails] = useState('');

  // Template state
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  
  // Editing state for rows
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingData, setEditingData] = useState(null);

  // Initialize template from messages and load saved ones
  useEffect(() => {
    const lastDraft = [...messages].reverse().find(m => m.isDraft);
    setTemplateSubject(lastDraft?.subject || 'Outreach from E-LABZ AI');
    setTemplateBody(lastDraft?.text || 'Hello,\n\nI noticed your business and would love to connect.');
    
    fetchSavedTemplates();
  }, [messages]);

  const fetchSavedTemplates = async () => {
    try {
      const data = await getTemplates();
      setSavedTemplates(data);
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  };

  const handleScrape = async () => {
    if (!keyword) {
      setError('Please enter a search keyword.');
      return;
    }
    setError(null);
    setIsScraping(true);
    setLeads([]);
    setSelectedIndices(new Set());
    
    try {
      const results = await scrapeLeads(keyword, cityName, countryName);
      setLeads(results);
      // Select all by default
      setSelectedIndices(new Set(results.map((_, i) => i)));
      if (results.length === 0) {
        setError('No leads found for this search.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsScraping(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === leads.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(leads.map((_, i) => i)));
    }
  };

  const toggleSelect = (index) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedIndices(next);
  };

  const handleBulkSend = () => {
    const selectedLeads = leads.filter((_, i) => selectedIndices.has(i));
    const leadsWithEmails = selectedLeads.filter(l => l.emails && l.emails.length > 0);
    
    if (leadsWithEmails.length === 0) {
      setError('No selected leads with email addresses to send to.');
      return;
    }

    setShowSendConfirm(true);
  };

  const performBulkSend = async () => {
    const selectedLeads = leads.filter((_, i) => selectedIndices.has(i));
    const leadsWithEmails = selectedLeads.filter(l => l.emails && l.emails.length > 0);
    
    setShowSendConfirm(false);
    setError(null);
    setIsSending(true);
    setSuccessCount(0);
    setSendingProgress({ current: 0, total: leadsWithEmails.length });

    if (leadsWithEmails.length === 0) {
      setIsSending(false);
      return;
    }

    try {
        // Send the very first one immediately
        const firstLead = leadsWithEmails[0];
        setSendingProgress({ current: 1, total: leadsWithEmails.length });
        await sendEmail(firstLead.emails[0], templateSubject, templateBody, keyword);
        setSuccessCount(1);
        
        // Queue the rest to be sent 1 every 3 minutes
        const restLeads = leadsWithEmails.slice(1);
        if (restLeads.length > 0) {
            const queueItems = restLeads.map(lead => ({
                email: lead.emails[0], 
                subject: templateSubject, 
                message: templateBody, 
                niche: keyword || 'Unknown'
            }));
            await queueEmails(queueItems);
        }
    } catch (err) {
        setError("Failed to start outreach: " + err.message);
    }
    
    setSendingProgress({ current: leadsWithEmails.length, total: leadsWithEmails.length });
    setIsSending(false);
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(leads, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `leads_${keyword.replace(/\s+/g, '_')}_${cityName}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleCleanJunk = () => {
    const junkPatterns = ['sentry.io', 'domain.com', 'example.com', 'test.com'];
    const nextLeads = leads.map(lead => ({
      ...lead,
      emails: lead.emails.filter(email => !junkPatterns.some(p => email.includes(p)))
    }));
    setLeads(nextLeads);
    
    // Also deselect those with no emails left
    const nextSelected = new Set(selectedIndices);
    nextLeads.forEach((l, i) => {
        if (!l.emails || l.emails.length === 0) {
            nextSelected.delete(i);
        }
    });
    setSelectedIndices(nextSelected);
  };
  const handleManualAdd = () => {
    if (!manualEmails.trim()) {
      setError('Please enter some email addresses.');
      return;
    }

    const emailList = manualEmails
      .split(/[\s,]+/)
      .map(e => e.trim())
      .filter(e => e && e.includes('@'));

    if (emailList.length === 0) {
      setError('No valid email addresses found.');
      return;
    }

    const newLeads = emailList.map(email => ({
      name: email.split('@')[0], // Use email prefix as name for manual ones
      emails: [email],
      address: 'Manual Entry',
      website: '',
      phone: ''
    }));

    const updatedLeads = [...leads, ...newLeads];
    setLeads(updatedLeads);
    
    // Select the newly added leads
    const nextSelected = new Set(selectedIndices);
    newLeads.forEach((_, i) => nextSelected.add(leads.length + i));
    setSelectedIndices(nextSelected);
    
    setManualEmails('');
    setError(null);
  };

  const startEditing = (index) => {
    setEditingIndex(index);
    setEditingData({ ...leads[index], emails: leads[index].emails.join(', ') });
  };

  const saveEdit = () => {
    const nextLeads = [...leads];
    nextLeads[editingIndex] = {
      ...editingData,
      emails: editingData.emails.split(',').map(e => e.trim()).filter(e => e)
    };
    setLeads(nextLeads);
    setEditingIndex(null);
    setEditingData(null);
  };

  const handleSaveTemplate = async () => {
    if (!templateName) {
      setError('Please enter a name for the template.');
      return;
    }

    setIsSavingTemplate(true);
    try {
      const templateData = {
        name: templateName,
        subject: templateSubject,
        body: templateBody
      };

      // If we have a selected ID, update it
      if (selectedTemplateId) {
        templateData.id = selectedTemplateId;
      }

      const saved = await saveTemplate(templateData);
      if (saved) {
        setSelectedTemplateId(saved.id);
      }
      
      await fetchSavedTemplates();
      setError(null);
    } catch (err) {
      setError('Failed to save template: ' + err.message);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleLoadTemplate = (t) => {
    setSelectedTemplateId(t.id);
    setTemplateName(t.name);
    setTemplateSubject(t.subject);
    setTemplateBody(t.body);
    setShowTemplateMenu(false);
  };

  const handleNewTemplate = () => {
    setSelectedTemplateId(null);
    setTemplateName('');
    setTemplateSubject('');
    setTemplateBody('');
    setShowTemplateMenu(false);
  };

  const handleDeleteTemplate = (e, id) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteTemplate(deleteConfirmId);
      if (selectedTemplateId === deleteConfirmId) {
        handleNewTemplate();
      }
      await fetchSavedTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  return (
    <div className="app-container">
      <header className="chat-header">
        <div className="header-left">
          <div className="flex-center" style={{ gap: '1rem' }}>
            <button onClick={onBack} className="btn-secondary flex-center" title="Back to Chat">
              <ArrowLeft className="icon-small" />
            </button>
            <div>
              <h1>Bulk Outreach</h1>
              <p>Scrape leads and manage outreach</p>
            </div>
          </div>
        </div>
      </header>

      <div className="kb-content">
        <div className="bulk-form" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => setActiveTab('search')}
              style={{ 
                padding: '0.75rem 1.5rem', 
                background: 'none', 
                border: 'none', 
                color: activeTab === 'search' ? 'var(--primary)' : '#8b949e',
                borderBottom: activeTab === 'search' ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              Search & Scrape
            </button>
            <button 
              onClick={() => setActiveTab('manual')}
              style={{ 
                padding: '0.75rem 1.5rem', 
                background: 'none', 
                border: 'none', 
                color: activeTab === 'manual' ? 'var(--primary)' : '#8b949e',
                borderBottom: activeTab === 'manual' ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              Manual Input
            </button>
          </div>

          {activeTab === 'search' ? (
            <>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Country</label>
                  <Select
                    showSearch
                    style={{ width: '100%', height: '45px' }}
                    placeholder="Select a country"
                    optionFilterProp="children"
                    value={countryId}
                    onChange={(val) => {
                      setCountryId(val);
                      const countryCities = City.getCitiesOfCountry(val);
                      setCityId(countryCities.length > 0 ? countryCities[0].name : '');
                    }}
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={countries.map(c => ({ value: c.isoCode, label: c.name }))}
                  />
                </div>
                <div className="form-group flex-1">
                  <label>City</label>
                  <Select
                    showSearch
                    style={{ width: '100%', height: '45px' }}
                    placeholder="Select a city"
                    optionFilterProp="children"
                    value={cityId}
                    onChange={(val) => setCityId(val)}
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={cities.map(c => ({ value: c.name, label: c.name }))}
                  />
                </div>
                <div className="form-group flex-2">
                  <label>Keyword</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text"
                      placeholder="e.g. dental clinics"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      className="chat-input-field"
                      style={{ width: '100%', paddingLeft: '40px' }}
                    />
                    <Search className="icon-small" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8b949e' }} />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleScrape} 
                disabled={isScraping || isSending}
                className="btn-primary"
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {isScraping ? <><Loader2 className="icon-small spin" /> Scraping...</> : <><Search className="icon-small" /> Start Scraping</>}
              </button>
            </>
          ) : (
            <div className="form-group">
              <label>Paste email addresses (separated by commas or spaces)</label>
              <textarea 
                value={manualEmails}
                onChange={e => setManualEmails(e.target.value)}
                placeholder="email1@example.com, email2@example.com, email3@example.com..."
                className="kb-textarea"
                rows={4}
                style={{ marginTop: '0.5rem', fontSize: '0.95rem' }}
              />
              <button 
                onClick={handleManualAdd}
                className="btn-primary"
                style={{ width: '100%', marginTop: '1rem' }}
              >
                <Plus className="icon-small" /> Add to List
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginTop: '1rem' }}>
            <AlertCircle className="icon-small" /> {error}
          </div>
        )}

        {successCount > 0 && !isSending && (
          <div className="alert alert-success" style={{ marginTop: '1rem' }}>
            <CheckCircle className="icon-small" /> Sent 1 email immediately. The remaining {leads.filter((_, i) => selectedIndices.has(i)).filter(l => l.emails && l.emails.length > 0).length - 1} leads have been queued and will be sent 1 every 3 minutes.
          </div>
        )}

        {leads.length > 0 && (
          <div className="results-container" style={{ marginTop: '2rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '1rem', 
              flexWrap: 'wrap', 
              gap: '0.75rem' 
            }}>
              <div className="flex-center" style={{ flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                <h3 style={{ margin: 0, marginRight: '0.5rem' }}>{selectedIndices.size}/{leads.length} selected</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleCleanJunk} className="btn-secondary flex-center" title="Filter out common junk emails" style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}>
                      <Filter className="icon-small" /> Clean
                  </button>
                  <button onClick={handleDownloadJSON} className="btn-secondary flex-center" style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}>
                      <Download className="icon-small" /> JSON
                  </button>
                </div>
              </div>
              <button 
                onClick={handleBulkSend} 
                disabled={isSending || isScraping || selectedIndices.size === 0}
                className="btn-primary"
                style={{ 
                  backgroundColor: 'var(--user-bubble)',
                  flex: window.innerWidth < 480 ? '1' : 'none',
                  marginTop: window.innerWidth < 480 ? '0.5rem' : '0'
                }}
              >
                {isSending ? (
                  <><Loader2 className="icon-small spin" /> Sending ({sendingProgress.current}/{sendingProgress.total})</>
                ) : (
                  <><Send className="icon-small" /> Send Bulk Outreach</>
                )}
              </button>
            </div>

            <div className="table-wrapper" style={{ overflowX: 'auto', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '12px', width: '40px' }}>
                        <button onClick={toggleSelectAll} className="btn-icon" style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                            {selectedIndices.size === leads.length ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                    </th>
                    <th style={{ padding: '12px', width: '28%' }}>Business</th>
                    <th style={{ padding: '12px', width: '28%' }}>Phone / WhatsApp</th>
                    <th style={{ padding: '12px', width: '28%' }}>Contact</th>
                    <th style={{ padding: '12px', width: '80px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', opacity: selectedIndices.has(idx) ? 1 : 0.5 }}>
                      <td style={{ padding: '12px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        <button onClick={() => toggleSelect(idx)} className="btn-icon" style={{ background: 'none', border: 'none', color: selectedIndices.has(idx) ? 'var(--primary)' : '#8b949e', cursor: 'pointer' }}>
                            {selectedIndices.has(idx) ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                      </td>
                      <td style={{ padding: '12px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        {editingIndex === idx ? (
                            <input 
                                className="chat-input-field" 
                                value={editingData.name} 
                                onChange={e => setEditingData({...editingData, name: e.target.value})}
                                style={{ padding: '4px 8px', fontSize: '0.9rem' }}
                            />
                        ) : (
                            <div style={{ fontWeight: '600' }}>{lead.name}</div>
                        )}
                        {lead.website && <a href={lead.website} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{lead.website}</a>}
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.85rem', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        {editingIndex === idx ? (
                             <input 
                                className="chat-input-field" 
                                value={editingData.phone || ''} 
                                onChange={e => setEditingData({...editingData, phone: e.target.value})}
                                style={{ padding: '4px 8px', fontSize: '0.9rem', width: '100%' }}
                                placeholder="Phone number"
                            />
                        ) : (
                          <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '4px' }}>
                            {lead.phone ? (
                                <>
                                    <Phone className="icon-small" style={{ width: '12px' }} /> {lead.phone}
                                </>
                            ) : (
                                <span style={{ color: '#8b949e' }}>No phone</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        {editingIndex === idx ? (
                            <input 
                                className="chat-input-field" 
                                value={editingData.emails} 
                                onChange={e => setEditingData({...editingData, emails: e.target.value})}
                                style={{ padding: '4px 8px', fontSize: '0.9rem', width: '100%' }}
                                placeholder="Comma separated emails"
                            />
                        ) : (
                            <>
                                {lead.emails && lead.emails.length > 0 ? (
                                <div className="flex-center" style={{ justifyContent: 'flex-start', color: '#3fb950', fontSize: '0.85rem' }}>
                                    <Mail className="icon-small" /> {lead.emails[0]}
                                </div>
                                ) : (
                                <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>No email found</div>
                                )}
                            </>
                        )}
                        {/* Phone now displayed in its own column */}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {editingIndex === idx ? (
                            <div className="flex-center">
                                <button onClick={saveEdit} className="btn-secondary" style={{ padding: '4px' }} title="Save"><Save size={14} /></button>
                                <button onClick={() => setEditingIndex(null)} className="btn-secondary" style={{ padding: '4px' }} title="Cancel"><X size={14} /></button>
                            </div>
                        ) : (
                            <button onClick={() => startEditing(idx)} className="btn-secondary" style={{ padding: '4px' }} title="Edit Lead"><Edit2 size={14} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="template-editor" style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--draft-bubble)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div className="draft-label" style={{ margin: 0 }}>Template Editor</div>
            <div className="flex-center" style={{ gap: '0.5rem', position: 'relative' }}>
               <button onClick={handleNewTemplate} className="btn-secondary flex-center" title="Start a fresh template">
                  <Plus size={16} /> New
               </button>
               {savedTemplates.length > 0 && (
                 <button onClick={() => setShowTemplateMenu(true)} className="btn-secondary flex-center">
                   <ChevronDown className="icon-small" /> Load Saved Template
                 </button>
               )}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Template Name</label>
            <input 
              type="text"
              placeholder="e.g. Dental Outreach - Initial"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="chat-input-field"
              style={{ width: '100%', marginTop: '0.4rem' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Email Subject</label>
            <input 
              type="text"
              placeholder="Enter email subject"
              value={templateSubject}
              onChange={(e) => setTemplateSubject(e.target.value)}
              className="chat-input-field"
              style={{ width: '100%', marginTop: '0.4rem' }}
            />
          </div>

          <div className="form-group">
            <label>Email Body</label>
            <textarea 
              value={templateBody}
              onChange={(e) => setTemplateBody(e.target.value)}
              placeholder="Write your email content here..."
              className="kb-textarea"
              rows={8}
              style={{ marginTop: '0.4rem', fontSize: '0.95rem', lineHeight: '1.5' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button 
                onClick={handleSaveTemplate} 
                disabled={isSavingTemplate}
                className="btn-primary flex-center"
                style={{ background: 'var(--primary)', color: '#fff', padding: '0.6rem 1.2rem' }}
            >
                {isSavingTemplate ? <><Loader2 className="icon-small spin" /> Saving...</> : <><Save className="icon-small" /> Save Template</>}
            </button>
          </div>

          <p style={{ fontSize: '0.75rem', color: '#8b949e', marginTop: '1rem' }}>
            * Changes here will apply to all emails sent in this bulk batch.
          </p>
        </div>
      </div>

      {/* Template Selector Modal */}
      {showTemplateMenu && (
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
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            overflow: 'hidden'
          }}>
            <div style={{ 
              padding: '1.5rem', 
              borderBottom: '1px solid var(--border-color)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: 'rgba(255,255,255,0.02)'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>Saved Templates</h2>
              <button 
                onClick={() => setShowTemplateMenu(false)} 
                className="btn-icon" 
                style={{ color: '#8b949e', padding: '4px' }}
              >
                <X size={24} />
              </button>
            </div>
            
            <div style={{ overflowY: 'auto', padding: '1rem' }}>
              {savedTemplates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#8b949e' }}>
                  No saved templates found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {savedTemplates.map(t => (
                    <div 
                      key={t.id} 
                      onClick={() => handleLoadTemplate(t)}
                      className="flex-center"
                      style={{ 
                        padding: '1rem', 
                        cursor: 'pointer', 
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: selectedTemplateId === t.id ? 'var(--primary)' : 'var(--border-color)',
                        justifyContent: 'space-between',
                        fontSize: '1rem',
                        background: selectedTemplateId === t.id ? 'rgba(88, 166, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => { 
                        if (selectedTemplateId !== t.id) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                          e.currentTarget.style.borderColor = '#8b949e';
                        }
                      }}
                      onMouseLeave={(e) => { 
                        if (selectedTemplateId !== t.id) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                        <span style={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap', 
                          fontWeight: '600', 
                          color: selectedTemplateId === t.id ? 'var(--primary)' : '#fff' 
                        }}>{t.name}</span>
                        <span style={{ fontSize: '0.8rem', color: '#8b949e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Subject: {t.subject}
                        </span>
                      </div>
                      <button onClick={(e) => handleDeleteTemplate(e, t.id)} className="btn-icon" style={{ color: '#f85149', padding: '8px' }} title="Delete Template">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)' }}>
              <button 
                onClick={handleNewTemplate} 
                className="btn-primary" 
                style={{ width: '100%', height: '45px' }}
              >
                <Plus className="icon-small" /> Create New Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmId && (
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
            padding: '2rem',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            textAlign: 'center'
          }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: 'rgba(248, 81, 73, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              color: '#f85149'
            }}>
              <Trash2 size={30} />
            </div>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Delete Template?</h2>
            <p style={{ color: '#8b949e', marginBottom: '2rem', fontSize: '0.9rem' }}>
              Are you sure you want to delete this template? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={cancelDelete} 
                className="btn-secondary" 
                style={{ flex: 1, height: '45px' }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                className="btn-primary" 
                style={{ flex: 1, height: '45px', backgroundColor: '#f85149', borderColor: '#f85149' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Send Confirmation Modal */}
      {showSendConfirm && (
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
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            textAlign: 'center'
          }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: 'rgba(34, 134, 54, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              color: 'var(--user-bubble)'
            }}>
              <Send size={32} />
            </div>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', color: '#fff' }}>Start Bulk Outreach?</h2>
            <div style={{ 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: '8px', 
              padding: '1rem', 
              marginBottom: '2rem',
              border: '1px solid var(--border-color)'
            }}>
              <p style={{ color: '#8b949e', fontSize: '0.95rem', margin: 0 }}>
                You are about to send personalized emails to 
                <strong style={{ color: 'var(--primary)', margin: '0 4px' }}>
                  {leads.filter((_, i) => selectedIndices.has(i)).filter(l => l.emails && l.emails.length > 0).length}
                </strong> 
                recipients individually.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setShowSendConfirm(false)} 
                className="btn-secondary" 
                style={{ flex: 1, height: '48px', fontSize: '1rem' }}
              >
                Cancel
              </button>
              <button 
                onClick={performBulkSend} 
                className="btn-primary" 
                style={{ flex: 1, height: '48px', backgroundColor: 'var(--user-bubble)', borderColor: 'var(--user-bubble)', fontSize: '1rem' }}
              >
                Yes, Send Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
