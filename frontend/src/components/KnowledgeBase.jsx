import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { getKnowledgeBase, updateKnowledgeBase } from '../services/api';

const KnowledgeBase = () => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await getKnowledgeBase();
      if (data.documents && data.documents.length > 0) {
        setBlocks(data.documents.map(d => d.content));
      } else {
        // Default blocks if empty
        setBlocks([
          "My Name: [Your Name]\nContact Email: [Your Email]\nWhatsApp: [Your Number]\nWebsite: [Your Site]",
          "I am a specialized developer building custom AI chatbots for modern businesses." 
        ]);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (index, value) => {
    const updated = [...blocks];
    updated[index] = value;
    setBlocks(updated);
  };

  const handleRemove = (index) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    setBlocks([...blocks, ""]);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // Filter out empty blocks before saving
      const cleanBlocks = blocks.filter(b => b.trim() !== "");
      setBlocks(cleanBlocks);
      
      const res = await updateKnowledgeBase(cleanBlocks);
      if (res.success) {
        setMessage({ type: 'success', text: 'Knowledge Base successfully updated!' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="kb-container"><div className="loading-state">Loading knowledge base...</div></div>;
  }

  return (
    <div className="kb-container">
      <div className="kb-header">
         <h2>Knowledge Base</h2>
         <button onClick={handleSave} className="btn-primary flex-center" disabled={saving}>
            <Save className="icon-small" /> {saving ? 'Saving...' : 'Update Base'}
         </button>
      </div>

      <div className="kb-content">
        {message && (
          <div className={`alert ${message.type === 'error' ? 'alert-danger' : 'alert-success'}`}>
             {message.text}
          </div>
        )}

        <p className="kb-description">
          These background documents define your exact expertise and contact information. The AI chatbot searches across this exact text to compose personalized outreach emails perfectly representing you.
        </p>

        <div className="kb-blocks">
           {blocks.map((block, index) => (
             <div key={index} className="kb-block">
                <div className="block-header">
                   <span>Block #{index + 1}</span>
                   <button onClick={() => handleRemove(index)} className="btn-danger-icon" title="Remove Block">
                      <Trash2 className="icon-small" />
                   </button>
                </div>
                <textarea 
                  className="kb-textarea"
                  rows={4}
                  value={block}
                  onChange={(e) => handleUpdate(index, e.target.value)}
                  placeholder="Enter expertise, case studies, or contact info here..."
                />
             </div>
           ))}
        </div>

        <button onClick={handleAdd} className="btn-secondary flex-center mt-1">
           <Plus className="icon-small" /> Add New Paragraph
        </button>
      </div>
    </div>
  );
};

export default KnowledgeBase;
