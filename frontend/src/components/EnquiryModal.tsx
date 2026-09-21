import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { X, Sparkles, CheckCircle2, ShieldCheck, Send, ArrowRight, Lock, Phone, Mail, MessageSquare } from 'lucide-react';
import { ServiceDefinition, LocationEntity, Lead } from '../types';

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: ServiceDefinition[];
  defaultServiceId?: string;
  defaultLocationId?: string;
  defaultFreelancerId?: string;
}

export const EnquiryModal: React.FC<EnquiryModalProps> = ({
  isOpen,
  onClose,
  services,
  defaultServiceId,
  defaultLocationId,
  defaultFreelancerId
}) => {
  const [clientName, setClientName] = useState('');
  const [contactMethod, setContactMethod] = useState<'Email' | 'WhatsApp'>('Email');
  const [contactValue, setContactValue] = useState('');
  const [serviceId, setServiceId] = useState(defaultServiceId || 'S01');
  const [locationName, setLocationName] = useState('Worldwide Remote');
  const [locationId, setLocationId] = useState(defaultLocationId || 'loc-ctry-in');
  const [remotePreference, setRemotePreference] = useState<'remote_ok' | 'onsite_preferred'>('remote_ok');
  const [projectDescription, setProjectDescription] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [timeline, setTimeline] = useState('Within 4 weeks');
  const [consentGiven, setConsentGiven] = useState(true);
  const [routingMode, setRoutingMode] = useState<'platform_first' | 'direct_assignment'>('platform_first');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedLead, setSavedLead] = useState<Lead | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (defaultServiceId) setServiceId(defaultServiceId);
    if (defaultLocationId) setLocationId(defaultLocationId);
    if (defaultFreelancerId) {
      setRoutingMode('direct_assignment');
    }
  }, [defaultServiceId, defaultLocationId, defaultFreelancerId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !contactValue || !projectDescription) {
      setErrorMessage('Please complete all required fields.');
      return;
    }
    if (!consentGiven) {
      setErrorMessage('Please consent to share project details with the assigned specialist.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Deterministic client idempotency key to prevent duplicate submissions
      const idempotencyKey = `lead-${clientName.trim().toLowerCase().replace(/\s+/g, '-')}-${contactValue.trim()}-${Date.now().toString().slice(0, 7)}`;

      const res = await apiFetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey,
          clientName,
          contactMethod,
          contactValue,
          serviceId,
          locationId,
          locationName,
          remotePreference,
          projectDescription,
          budgetRange,
          timeline,
          sourcePageUrl: window.location.pathname,
          chosenFreelancerId: defaultFreelancerId || undefined,
          consentGiven,
          routingMode
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSavedLead(data.lead);
      } else {
        setErrorMessage(data.error || 'Failed to submit enquiry.');
      }
    } catch (err) {
      setErrorMessage('Network connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSavedLead(null);
    setClientName('');
    setContactValue('');
    setProjectDescription('');
    onClose();
  };

  return (
    <div data-testid="enquiry-overlay" role="dialog" aria-modal="true" aria-label="Project brief" className="enquiry-overlay fixed inset-0 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="enquiry-window relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl text-left text-slate-800">
        
        {/* Close Button */}
        <button
          data-testid="enquiry-close"
          onClick={onClose}
          className="absolute top-6 right-6 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {savedLead ? (
          /* Confirmation State */
          <div data-testid="enquiry-success" role="status" className="py-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-xs">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h3 className="text-2xl font-bold text-slate-900 font-display">
              Project Brief Saved!
            </h3>

            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Thank you, <strong className="text-slate-900">{savedLead.clientName}</strong>. Your enquiry for <strong className="text-indigo-600">{services.find(s => s.id === savedLead.serviceId)?.title || savedLead.serviceId}</strong> has been transactionally recorded in our database.
            </p>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 max-w-md mx-auto text-left text-xs space-y-2 text-slate-600 font-mono">
              <div className="flex flex-wrap gap-2 justify-between break-all">
                <span className="text-slate-500">Lead Record ID:</span>
                <span className="text-indigo-600 font-bold">{savedLead.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Routing Status:</span>
                <span className="text-emerald-700 font-bold uppercase">{savedLead.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Routing Mode:</span>
                <span className="text-slate-900 font-bold">{savedLead.routingMode}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 max-w-md mx-auto">
              A qualified specialist will review your brief and follow up via {savedLead.contactMethod} ({savedLead.contactValue}) with an itemized proposal.
            </p>

            <div className="pt-4">
              <button
                onClick={handleReset}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 py-2.5 px-6 text-sm font-bold text-white transition-colors shadow-xs"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          /* Form State */
          <div>
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Qualified Project Scoping</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 font-display">
                Start Your Project with ER Freelancer
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tell us about your project requirements. Direct developer collaboration, milestone protection, and zero agency markups.
              </p>
            </div>

            {/* Direct Call & WhatsApp Ribbon (No raw numbers) */}
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                <span className="text-slate-700 font-medium">Need instant consultation?</span>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="tel:+919711623561"
                  className="inline-flex items-center gap-1 font-bold text-indigo-700 hover:underline"
                >
                  <Phone className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Call Helpline</span>
                </a>
                <span className="text-slate-300">•</span>
                <a
                  href="https://wa.me/919711623561?text=Hello%20Rajeev,%20I%20have%20a%20project%20enquiry"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
                {errorMessage}
              </div>
            )}

            <form data-testid="enquiry-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Client Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    data-testid="enquiry-name-input"
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 shadow-xs"
                  />
                </div>

                {/* Contact Value */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {contactMethod} Address / Number *
                  </label>
                  <input
                    data-testid="enquiry-contact-input"
                    type="text"
                    required
                    value={contactValue}
                    onChange={(e) => setContactValue(e.target.value)}
                    placeholder={contactMethod === 'Email' ? 'alex@company.com' : '+1 555 123 4567'}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 shadow-xs"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Service intent */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Selected Service Intent *
                  </label>
                  <select
                    data-testid="enquiry-service-select"
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 shadow-xs font-medium"
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.id}>
                        {`${s.id}: ${s.title}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Delivery Preference */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Delivery Mode Preference
                  </label>
                  <select
                    data-testid="enquiry-delivery-select"
                    value={remotePreference}
                    onChange={(e) => setRemotePreference(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 shadow-xs font-medium"
                  >
                    <option value="remote_ok">Remote Specialist (Worldwide Timezone Overlap)</option>
                    <option value="onsite_preferred">Locally Based Onsite Preferred</option>
                  </select>
                </div>

              </div>

              {/* Project Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Project Description & Core Deliverables *
                </label>
                <textarea
                  data-testid="enquiry-description-input"
                  rows={4}
                  required
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Outline what you are looking to build or optimize, current website/app URLs, tech preferences, and any specific deadlines..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Budget Range */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Target Budget (Custom / Open)
                  </label>
                  <input
                    data-testid="enquiry-budget-input"
                    type="text"
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    placeholder="e.g. ₹25,000 / $1,200 / Discuss after scope"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 shadow-xs font-medium"
                  />
                </div>

                {/* Timeline */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Completion Date
                  </label>
                  <select
                    data-testid="enquiry-timeline-select"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 shadow-xs font-medium"
                  >
                    <option value="Urgent (1-2 weeks)">Urgent (1-2 weeks)</option>
                    <option value="Within 4 weeks">Within 4 weeks</option>
                    <option value="2-3 months">2-3 months</option>
                    <option value="Flexible / Scoping phase">Flexible / Scoping phase</option>
                  </select>
                </div>

              </div>

              {/* Consent and Safeguards Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    data-testid="enquiry-consent-checkbox"
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] text-slate-600 leading-snug">
                    I consent to share this project brief with vetted ER Freelancer specialists for scope preparation under standard non-disclosure terms.
                  </span>
                </label>
              </div>

              {/* Submit CTA */}
              <div className="pt-3">
                <button
                  data-testid="enquiry-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3.5 px-6 text-sm font-bold text-white shadow-xs transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Submitting Brief...</span>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Project Brief</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
};
