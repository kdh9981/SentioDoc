'use client'
import React, { useState, useRef } from 'react';
import { UploadCloud, Link as LinkIcon, BarChart3, ArrowRight, Check, FileText, X, Youtube, Twitter, Linkedin, Instagram, Copy } from 'lucide-react';
import { FloatingIcons } from './FloatingIcons';

interface UploadedFile {
  name: string;
  size: number;
}

const HowItWorks: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [inputMode, setInputMode] = useState<'upload' | 'link'>('upload');

  // Step 1 state
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [contentTitle, setContentTitle] = useState('');
  const [pastedUrl, setPastedUrl] = useState('');
  const [linkSlugTitle, setLinkSlugTitle] = useState('');

  // Step 2 state
  const [selectedSlug, setSelectedSlug] = useState(0);
  const [finalSlug, setFinalSlug] = useState('');
  const [finalDomain, setFinalDomain] = useState('linklens.tech');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 15);
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile({ name: file.name, size: file.size });
      // Auto-fill content title from filename (without extension)
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setContentTitle(nameWithoutExt);
    }
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadedFile({ name: file.name, size: file.size });
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setContentTitle(nameWithoutExt);
    }
  };

  // Clear file
  const clearFile = () => {
    setUploadedFile(null);
    setContentTitle('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Proceed to step 2
  const goToStep2 = () => {
    const slug = inputMode === 'upload' ? generateSlug(contentTitle) : generateSlug(linkSlugTitle || 'my-link');
    setFinalSlug(slug);
    setSelectedSlug(0);
    setCurrentStep(2);
  };

  // Get slug suggestions based on user input
  const getSlugSuggestions = () => {
    const baseSlug = (finalSlug || 'content').substring(0, 15);
    return [
      { domain: 'linklens.tech', slug: baseSlug, type: 'FREE', isUser: true },
      { domain: 'linklens.tech', slug: `my-${baseSlug.substring(0, 10)}-gallery`, type: 'FREE', isUser: false },
      { domain: 'your-domain.com', slug: baseSlug, type: 'PAID', isUser: false },
    ];
  };

  // Create link and go to step 3
  const createLink = () => {
    const suggestions = getSlugSuggestions();
    setFinalSlug(suggestions[selectedSlug].slug);
    setFinalDomain(suggestions[selectedSlug].domain);
    setCurrentStep(3);
  };

  // Reset flow - Complete reset to initial state
  const resetFlow = () => {
    setCurrentStep(1);
    setInputMode('upload');
    setUploadedFile(null);
    setContentTitle('');
    setPastedUrl('');
    setLinkSlugTitle('');
    setSelectedSlug(0);
    setFinalSlug('');
    setFinalDomain('linklens.tech');
  };

  const canProceedStep1 = inputMode === 'upload'
    ? (uploadedFile !== null && contentTitle.trim() !== '')
    : (pastedUrl.trim() !== '' && linkSlugTitle.trim() !== '');

  // Fixed card height
  const cardHeight = '580px';

  return (
    <section id="how-it-works" style={{ padding: '100px 24px', background: 'linear-gradient(to bottom, #f8faff, #ffffff)', position: 'relative', overflow: 'hidden' }}>
      {/* Floating Icons */}
      <FloatingIcons variant="howItWorks" />
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{ fontSize: '48px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
            How LinkLens Works
          </h2>
          <p style={{ fontSize: '18px', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
            Start tracking in three simple steps. We use AI to optimize your links for better reach.
          </p>
        </div>

        {/* Cards Container */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', alignItems: 'start' }}>

          {/* ==================== STEP 1 ==================== */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '32px 24px',
            boxShadow: currentStep === 1 ? '0 25px 50px -12px rgba(99, 102, 241, 0.15)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
            border: currentStep === 1 ? '2px solid #6366f1' : '1px solid #e2e8f0',
            transition: 'all 0.3s ease',
            position: 'relative',
            height: cardHeight,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Step Badge */}
            <div style={{
              position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)',
              width: '40px', height: '40px', borderRadius: '50%',
              backgroundColor: currentStep > 1 ? '#22c55e' : '#6366f1',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '16px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}>
              {currentStep > 1 ? <Check size={20} /> : '1'}
            </div>

            {/* Icon */}
            <div style={{
              width: '72px', height: '72px', borderRadius: '20px',
              backgroundColor: currentStep === 1 ? '#eef2ff' : '#f8fafc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '16px auto 20px',
              flexShrink: 0
            }}>
              {inputMode === 'upload' ? (
                <UploadCloud style={{ width: '32px', height: '32px', color: currentStep === 1 ? '#6366f1' : '#94a3b8' }} />
              ) : (
                <LinkIcon style={{ width: '32px', height: '32px', color: currentStep === 1 ? '#6366f1' : '#94a3b8' }} />
              )}
            </div>

            {/* Title & Description */}
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', textAlign: 'center', flexShrink: 0 }}>
              {inputMode === 'upload' ? 'Upload File' : 'Paste Link'}
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', textAlign: 'center', marginBottom: '20px', lineHeight: 1.5, flexShrink: 0 }}>
              {inputMode === 'upload'
                ? 'Upload your documents, PDFs, or any file to track.'
                : 'Track any external URL - YouTube, social media, websites.'}
            </p>

            {/* Content Area - Flex grow to fill space */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {currentStep === 1 ? (
                <>
                  {/* Tab Toggle */}
                  <div style={{
                    display: 'flex', gap: '8px', marginBottom: '20px',
                    padding: '4px', backgroundColor: '#f1f5f9', borderRadius: '12px',
                    flexShrink: 0
                  }}>
                    <button
                      onClick={() => { setInputMode('upload'); clearFile(); setPastedUrl(''); setLinkSlugTitle(''); }}
                      style={{
                        flex: 1, padding: '10px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        backgroundColor: inputMode === 'upload' ? 'white' : 'transparent',
                        color: inputMode === 'upload' ? '#6366f1' : '#64748b',
                        boxShadow: inputMode === 'upload' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <UploadCloud size={16} /> Upload File
                    </button>
                    <button
                      onClick={() => { setInputMode('link'); clearFile(); }}
                      style={{
                        flex: 1, padding: '10px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        backgroundColor: inputMode === 'link' ? 'white' : 'transparent',
                        color: inputMode === 'link' ? '#6366f1' : '#64748b',
                        boxShadow: inputMode === 'link' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <LinkIcon size={16} /> Paste Link
                    </button>
                  </div>

                  {inputMode === 'upload' ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {!uploadedFile ? (
                        /* No file yet - show drag & drop only */
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleDrop}
                          style={{
                            border: '2px dashed #d1d5db', borderRadius: '16px', padding: '32px 20px',
                            textAlign: 'center', cursor: 'pointer', flex: 1,
                            transition: 'all 0.2s ease', backgroundColor: '#fafafa',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.backgroundColor = '#f5f3ff'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.backgroundColor = '#fafafa'; }}
                        >
                          <UploadCloud style={{ width: '40px', height: '40px', color: '#94a3b8', marginBottom: '12px' }} />
                          <p style={{ fontSize: '14px', color: '#475569', fontWeight: 500, marginBottom: '4px' }}>
                            Drag & drop your file here
                          </p>
                          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
                            PDF, DOCX, PPTX, Images
                          </p>
                          <span style={{ fontSize: '13px', color: '#6366f1', fontWeight: 600 }}>Browse files</span>
                          <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileSelect}
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.mp4,.mov"
                            style={{ display: 'none' }}
                          />
                        </div>
                      ) : (
                        /* File uploaded - show file preview + slug input */
                        <>
                          <div style={{
                            backgroundColor: '#f8fafc', borderRadius: '12px', padding: '12px 16px',
                            display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px',
                            border: '1px solid #e2e8f0', flexShrink: 0
                          }}>
                            <div style={{
                              width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#eef2ff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                              <FileText style={{ width: '20px', height: '20px', color: '#6366f1' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0, maxWidth: '180px' }}>
                                {uploadedFile.name}
                              </p>
                              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{formatFileSize(uploadedFile.size)}</p>
                            </div>
                            <button onClick={clearFile} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8', flexShrink: 0 }}>
                              <X size={18} />
                            </button>
                          </div>

                          {/* Content Title Input */}
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                              Content Title (for Slug generation)
                            </label>
                            <input
                              type="text"
                              value={contentTitle}
                              onChange={(e) => setContentTitle(e.target.value.substring(0, 50))}
                              placeholder="Enter a title for your content"
                              maxLength={50}
                              style={{
                                width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: '10px',
                                fontSize: '14px', outline: 'none', transition: 'border-color 0.2s',
                                boxSizing: 'border-box', backgroundColor: 'white', color: '#0f172a'
                              }}
                              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    /* Paste Link mode */
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {/* URL Input */}
                      <div style={{ marginBottom: '12px', flexShrink: 0 }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px',
                          border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: '#fafafa'
                        }}>
                          <LinkIcon size={18} style={{ color: '#94a3b8' }} />
                          <input
                            type="url"
                            value={pastedUrl}
                            onChange={(e) => setPastedUrl(e.target.value)}
                            placeholder="https://youtube.com/watch?v=..."
                            style={{
                              flex: 1, border: 'none', background: 'none', fontSize: '14px', outline: 'none',
                              color: '#475569'
                            }}
                          />
                        </div>
                      </div>

                      {/* Social Icons */}
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '4px', flexShrink: 0 }}>
                        <Youtube size={18} style={{ color: '#94a3b8' }} />
                        <Twitter size={18} style={{ color: '#94a3b8' }} />
                        <Linkedin size={18} style={{ color: '#94a3b8' }} />
                        <Instagram size={18} style={{ color: '#94a3b8' }} />
                      </div>
                      <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginBottom: '12px', flexShrink: 0 }}>
                        Supports YouTube, Socials, & any Web URL
                      </p>

                      {/* Slug Input for Link */}
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                          Custom Slug (for your branded link)
                        </label>
                        <input
                          type="text"
                          value={linkSlugTitle}
                          onChange={(e) => setLinkSlugTitle(e.target.value)}
                          placeholder="my-awesome-video"
                          style={{
                            width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px',
                            fontSize: '14px', outline: 'none', transition: 'border-color 0.2s',
                            boxSizing: 'border-box', backgroundColor: 'white', color: '#0f172a'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                      </div>
                    </div>
                  )}

                  {/* Next Step Button - Always at bottom */}
                  <button
                    onClick={goToStep2}
                    disabled={!canProceedStep1}
                    style={{
                      width: '100%', padding: '12px', backgroundColor: canProceedStep1 ? '#6366f1' : '#cbd5e1',
                      color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, fontSize: '15px',
                      cursor: canProceedStep1 ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      transition: 'all 0.2s ease',
                      marginTop: '16px',
                      flexShrink: 0
                    }}
                  >
                    Next Step <ArrowRight size={18} />
                  </button>
                </>
              ) : (
                /* Step 1 Completed State */
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FileText size={24} style={{ color: '#6366f1' }} />
                      <div style={{ overflow: 'hidden' }}>
                        <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, margin: 0 }}>FILE</p>
                        <p style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                          {(inputMode === 'upload' ? contentTitle || uploadedFile?.name : linkSlugTitle)?.substring(0, 30) || ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ==================== STEP 2 ==================== */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '32px 24px',
            boxShadow: currentStep === 2 ? '0 25px 50px -12px rgba(99, 102, 241, 0.15)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
            border: currentStep === 2 ? '2px solid #6366f1' : '1px solid #e2e8f0',
            transition: 'all 0.3s ease',
            position: 'relative',
            height: cardHeight,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Step Badge */}
            <div style={{
              position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)',
              width: '40px', height: '40px', borderRadius: '50%',
              backgroundColor: currentStep > 2 ? '#22c55e' : (currentStep >= 2 ? '#6366f1' : '#cbd5e1'),
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '16px'
            }}>
              {currentStep > 2 ? <Check size={20} /> : '2'}
            </div>

            {/* Icon */}
            <div style={{
              width: '72px', height: '72px', borderRadius: '20px',
              backgroundColor: currentStep === 2 ? '#eef2ff' : '#f8fafc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '16px auto 20px',
              flexShrink: 0
            }}>
              <LinkIcon style={{ width: '32px', height: '32px', color: currentStep === 2 ? '#6366f1' : '#94a3b8' }} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', textAlign: 'center', flexShrink: 0 }}>
              Get Branded Link
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', textAlign: 'center', marginBottom: '24px', lineHeight: 1.5, flexShrink: 0 }}>
              Our AI suggests memorable slugs based on your content category.
            </p>

            {/* Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {currentStep > 2 ? (
                /* Completed State */
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>{finalDomain}/{finalSlug.substring(0, 15)}</span>
                      <Copy size={14} style={{ color: '#6366f1' }} />
                    </div>
                  </div>
                </div>
              ) : currentStep === 2 ? (
                /* Active State */
                <>
                  <p style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '10px', flexShrink: 0 }}>
                    AI Suggestions (Personal)
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', flex: 1 }}>
                    {getSlugSuggestions().map((option, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedSlug(idx)}
                        style={{
                          padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                          border: selectedSlug === idx ? '2px solid #6366f1' : '1px solid #e2e8f0',
                          backgroundColor: selectedSlug === idx ? '#f5f3ff' : 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <span style={{ fontSize: '13px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                          {option.domain}/<strong style={{ color: '#0f172a' }}>{option.slug}</strong>
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px',
                            backgroundColor: option.type === 'PAID' ? '#fed7aa' : '#e2e8f0',
                            color: option.type === 'PAID' ? '#c2410c' : '#475569'
                          }}>
                            {option.type}
                          </span>
                          {selectedSlug === idx && <Check size={18} style={{ color: '#6366f1' }} />}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={createLink}
                    style={{
                      width: '100%', padding: '12px', backgroundColor: '#0f172a',
                      color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '14px',
                      cursor: 'pointer', transition: 'all 0.2s ease',
                      flexShrink: 0,
                      marginTop: 'auto'
                    }}
                  >
                    Create Link
                  </button>
                </>
              ) : (
                /* Waiting State - Default/Initial */
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontSize: '14px', color: '#94a3b8', textAlign: 'center', fontStyle: 'italic' }}>
                    Waiting for input...
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ==================== STEP 3 ==================== */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '32px 24px',
            boxShadow: currentStep === 3 ? '0 25px 50px -12px rgba(99, 102, 241, 0.15)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
            border: currentStep === 3 ? '2px solid #6366f1' : '1px solid #e2e8f0',
            transition: 'all 0.3s ease',
            position: 'relative',
            height: cardHeight,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Step Badge */}
            <div style={{
              position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)',
              width: '40px', height: '40px', borderRadius: '50%',
              backgroundColor: currentStep >= 3 ? '#6366f1' : '#cbd5e1',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '16px'
            }}>
              3
            </div>

            {/* Icon */}
            <div style={{
              width: '72px', height: '72px', borderRadius: '20px',
              backgroundColor: currentStep === 3 ? '#eef2ff' : '#f8fafc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '16px auto 20px',
              flexShrink: 0
            }}>
              <BarChart3 style={{ width: '32px', height: '32px', color: currentStep === 3 ? '#6366f1' : '#94a3b8' }} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', textAlign: 'center', flexShrink: 0 }}>
              See Who's Clicking
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', textAlign: 'center', marginBottom: '24px', lineHeight: 1.5, flexShrink: 0 }}>
              Track every view with detailed analytics and real-time viewer info.
            </p>

            {/* Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {currentStep === 3 ? (
                /* Active State */
                <>
                  {/* Bar Chart */}
                  <div style={{
                    display: 'flex', gap: '6px', alignItems: 'flex-end', justifyContent: 'center',
                    height: '100px', marginBottom: '24px', padding: '0 10px',
                    flex: 1
                  }}>
                    {[45, 60, 40, 75, 50, 65, 90].map((h, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: `${h}%`,
                          backgroundColor: i === 6 ? '#6366f1' : '#e2e8f0',
                          borderRadius: '4px',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    ))}
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', flexShrink: 0 }}>
                    <div>
                      <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                        Total Clicks
                      </p>
                      <p style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: 0 }}>1,245</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                        Top Location
                      </p>
                      <p style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>United States</p>
                    </div>
                  </div>

                  {/* Reset Button */}
                  <button
                    onClick={resetFlow}
                    style={{
                      width: '100%', padding: '12px', backgroundColor: 'transparent',
                      color: '#6366f1', border: 'none', fontWeight: 600, fontSize: '14px',
                      cursor: 'pointer', transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}
                  >
                    Create another link
                  </button>
                </>
              ) : (
                /* Waiting State - Default/Initial */
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontSize: '14px', color: '#94a3b8', textAlign: 'center', fontStyle: 'italic' }}>
                    Waiting for link creation...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
