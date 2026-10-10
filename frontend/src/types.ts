export interface BusinessFact {
  key: string;
  label: string;
  value: string;
  source: string;
  approvalStatus: 'approved' | 'pending' | 'flagged';
  owner: string;
  lastVerifiedDate: string;
  notes?: string;
}

export interface ServiceDefinition {
  id: string;
  slug: string;
  title: string;
  category: 'Websites' | 'Apps & Software' | 'Growth & Automation';
  primaryKeywordFamily: string[];
  scopeBoundary: string;
  deliverables: string[];
  exclusions: string[];
  techOptions: string[];
  briefQuestions: {
    id: string;
    question: string;
    placeholder: string;
    type: 'text' | 'select' | 'boolean';
    options?: string[];
  }[];
  typicalTimelineDays: string;
  pricingFactors: string[];
  active: boolean;
}

export interface LocationEntity {
  id: string;
  sourceId: string;
  name: string;
  type: 'country' | 'region' | 'city' | 'neighborhood';
  parentId: string | null;
  parentPath?: string;
  countryCode: string;
  countryName: string;
  slug: string;
  canonicalPath: string;
  bucket: string;
  timezone: string;
  lat?: number;
  lng?: number;
  aliases: string[];
  verified: boolean;
}

export interface FreelancerProfile {
  id: string;
  userId: string;
  slug: string;
  displayName: string;
  isFounder: boolean;
  specialistType?: 'ai_agent' | 'human';
  baseLocationId: string | null;
  baseLocationName?: string;
  primaryTitle?: string;
  qualifications?: string[];
  experienceYears?: string;
  rating?: number;
  completedProjects?: number;
  bio: string;
  profileState: 'draft' | 'under_review' | 'approved' | 'suspended' | 'changes_requested';
  services: string[];
  deliveryModes: ('remote' | 'onsite')[];
  coverageScope: 'worldwide_remote' | 'country_remote' | 'local_onsite';
  languages: string[];
  timezone: string;
  capacityStatus: 'available_now' | 'limited_capacity' | 'waitlist' | 'unavailable';
  verifiedBadges: {
    type: 'email_verified' | 'profile_reviewed' | 'identity_verified';
    awardedAt: string;
  }[];
  portfolioItems: {
    id: string;
    title: string;
    isReal: boolean;
    serviceId: string;
    summary: string;
    tags: string[];
    link?: string;
  }[];
  lastConfirmedDate: string;
}

export interface StructuredPageContent {
  schema_version: '1.0';
  page_id: string;
  service_id: string;
  location_id: string;
  locale: string;
  canonical_path: string;
  seo: {
    title: string;
    description: string;
    primary_intent: string;
    secondary_phrases: string[];
  };
  hero: {
    heading: string;
    summary: string;
  };
  delivery_modes: ('remote' | 'onsite')[];
  sections: {
    id: string;
    title: string;
    content: string;
  }[];
  brief_questions: {
    id: string;
    question: string;
    placeholder: string;
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
  internal_link_ids: string[];
  source_ids: string[];
  claims: string[];
  page_value_evidence: string[];
  direct_contact?: {
    phone: string;
    email: string;
    whatsapp: string;
  };
  review: {
    status: 'pending' | 'passed' | 'needs_review' | 'rejected';
    issues: string[];
  };
}

export interface PageRecord {
  id: string;
  serviceId: string;
  locationId: string;
  canonicalPath: string;
  revision: number;
  lifecycleState: 'planned' | 'draft' | 'generated' | 'needs_review' | 'approved' | 'published' | 'paused' | 'retired';
  contentPackage: StructuredPageContent;
  qualityScore: number;
  qualityIssues: string[];
  isPilot: boolean;
  generatedAt: string;
  publishedAt?: string;
  lastModifiedAt: string;
  modelProvenance: {
    engine: string;
    promptVersion: string;
    inputTokenEst: number;
    outputTokenEst: number;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface Lead {
  id: string;
  idempotencyKey: string;
  clientName: string;
  contactMethod: string;
  contactValue: string;
  serviceId: string;
  locationId: string;
  locationName: string;
  remotePreference: 'remote_ok' | 'onsite_preferred' | 'any';
  projectDescription: string;
  budgetRange?: string;
  timeline?: string;
  briefAnswers?: Record<string, string>;
  sourcePageUrl: string;
  chosenFreelancerId?: string;
  assignedFreelancerId?: string;
  consentGiven: boolean;
  routingMode: 'platform_first' | 'direct_assignment';
  status: 'new' | 'awaiting_review' | 'assigned' | 'contacted' | 'proposal_sent' | 'in_progress' | 'won' | 'lost' | 'archived';
  leadSource?: 'web_form' | 'chatbot' | 'location_quick_form';
  chatTranscript?: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface OutboxItem {
  id: string;
  leadId: string;
  recipient: string;
  channel: 'email';
  subject: string;
  body: string;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
  createdAt: string;
  deliveredAt?: string;
}

export interface LeadEvent {
  id: string;
  leadId: string;
  actor: string;
  eventType: 'created' | 'assigned' | 'reassigned' | 'status_changed' | 'note_added' | 'notified';
  details: string;
  timestamp: string;
}

export interface GenerationStats {
  totalTarget: number;
  generatedSoFar: number;
  approvedCount: number;
  needsReviewCount: number;
  failedCount: number;
  tokensUsedEst: number;
  costUSD: number;
  status: 'idle' | 'running' | 'paused' | 'completed';
  batchSpeedPagesPerSec: number;
}
