"""Create service-specific drafts, never evidence of publication or SEO quality.

Inserting a place name does not make a distinct local landing page. Location
evidence and publication decisions belong to the editorial review workflow.
"""
from datetime import datetime, timezone
from url_paths import canonical_location_path, verified_location_timezone

PHONE = "+91 97116 23561"
EMAIL = "hello@erfreelancer.com"

# Guidance describes work to discuss, not historical results or guarantees.
SERVICE_GUIDANCE = {
    "S01": {
        "label": "web design and development",
        "intro": "Plan a business website around the information visitors need and the actions you want them to take. Start with the page structure, content ownership, editing requirements and enquiry journey.",
        "focus": "Agree page templates, editor roles, responsive layouts and integrations. A migration also needs a URL inventory and redirect plan for pages that move.",
        "acceptance": "Review key pages on mobile and desktop, keyboard navigation, enquiry delivery, editable content, redirects and metadata. Record performance measurements against an agreed test environment.",
    },
    "S02": {
        "label": "mobile app development",
        "intro": "Turn a mobile workflow into defined screens, permissions and backend requirements. Establish whether the project needs Android, iOS or both, and which tasks must work offline.",
        "focus": "Map sign-in, roles, notifications, payments and device permissions. Decide how data synchronization handles interrupted connections. Prepare release assets and store-account access as separate dependencies.",
        "acceptance": "Test the agreed device matrix, account recovery, permission denial, offline behavior and API errors. Store submission can be in scope; approval timing is decided by the store.",
    },
    "S03": {
        "label": "WordPress development",
        "intro": "Scope a WordPress project around its publishing workflow, theme requirements and plugin dependencies. For an existing site, begin with a backup and staging copy before planning changes.",
        "focus": "Identify content types, editor roles, forms and commerce functions to retain. Compare supported theme configuration with custom blocks or plugins. Record third-party license and renewal responsibilities.",
        "acceptance": "Check editing tasks, forms, checkout where applicable, redirects, backups and the update process. Review representative pages and document remaining plugin constraints.",
    },
    "S04": {
        "label": "AI website development",
        "intro": "Add AI features when they support a clear visitor task, such as searching approved information or drafting content for review. Define the feature's limits before choosing a model.",
        "focus": "Identify approved data, retrieval permissions, evaluation examples and operating costs. Plan how the interface handles uncertain answers, unavailable providers and requests needing a human response.",
        "acceptance": "Evaluate representative questions and known failure cases. Test access boundaries, source attribution where relevant, fallback behavior and usage limits before release.",
    },
    "S05": {
        "label": "search engine optimization",
        "intro": "Build an SEO plan from crawl evidence, search intent and existing content. Separate technical fixes from editorial work and measure changes using actual search data.",
        "focus": "Review HTTP responses, rendering, canonical URLs, crawl rules, links and sitemaps. Map customer questions to useful pages and identify duplicate or unsupported content for revision.",
        "acceptance": "Keep an issue log, inspect representative URLs and verify deployed changes. Monitor impressions, clicks and enquiries; indexing, rankings and traffic remain search-engine outcomes.",
    },
    "S06": {
        "label": "social media optimization",
        "intro": "Organize social profiles and content around the audience you want to reach. Choose channels based on the business's capacity to publish useful material and respond to enquiries.",
        "focus": "Agree profile details, brand assets, content themes, approvals and a publishing calendar. Define how comments and messages reach the person responsible for responding.",
        "acceptance": "Review profile consistency, accessible creative assets, link tracking and content approval. Report observed engagement and enquiries without promising fixed follower or lead counts.",
    },
    "S07": {
        "label": "ecommerce development",
        "intro": "Plan an online store around the product catalog, checkout and fulfilment workflow. Establish markets, currencies and operational responsibilities before selecting integrations.",
        "focus": "Document variants, stock rules, payments, shipping, refunds and order notifications. Identify migration requirements and systems exchanging catalog or order data.",
        "acceptance": "Test successful and failed payments, duplicate callbacks, inventory changes and notifications. Confirm tax and payment configuration with the responsible business advisers and providers.",
    },
    "S08": {
        "label": "custom software development",
        "intro": "Translate a business process into user roles, data records and acceptance criteria. A focused first release makes dependencies and operational risks visible before expanding the application.",
        "focus": "Map the data model, permissions, integrations, reports and administrative actions. Agree migration, logging, backup and deployment responsibilities alongside the product workflow.",
        "acceptance": "Verify important workflows, permission boundaries, validation, failure recovery and agreed load scenarios. Document deployment, handover items and unresolved limitations.",
    },
    "S09": {
        "label": "ERP development and integration",
        "intro": "Scope ERP work around the modules and approvals connecting daily operations. Identify which system owns each record and who is accountable for its accuracy.",
        "focus": "Map inventory, procurement, invoicing or other requested modules, including roles, approvals and audit history. Review legacy data quality and agree a staged migration and reconciliation process.",
        "acceptance": "Use representative transactions to check stock movements, approvals, reports and integration failures. Reconcile migrated totals and obtain operational owners' sign-off before rollout.",
    },
    "S10": {
        "label": "CRM development",
        "intro": "Design a CRM around how enquiries are received, assigned and followed up. Agree stages and ownership rules before adding dashboards or automation.",
        "focus": "Specify contacts, duplicate handling, assignment rules, reminders and reporting. Plan import mapping and define which staff can view or export customer information.",
        "acceptance": "Test enquiry capture, assignment, stage changes, reminders and access controls. Reconcile reports with underlying records and document how failed integrations are retried.",
    },
    "S11": {
        "label": "AI workflow automation",
        "intro": "Choose a repetitive workflow with clear inputs, outputs and a responsible human owner. Define when automation may act and when a person must review the result.",
        "focus": "Map connections, approved data, model usage, retries and duplicate-event handling. Add review steps for actions needing approval and recovery paths for unavailable providers.",
        "acceptance": "Test representative documents or events, unexpected inputs, repeated requests and provider failures. Inspect logs, operating costs and the manual fallback before expanding the workflow.",
    },
    "S12": {
        "label": "Google Ads campaign management",
        "intro": "Plan paid search around the offer, audience and conversion you can measure. Setup depends on account access, suitable landing pages and an agreed advertising budget.",
        "focus": "Group search intent, define exclusions and review landing-page relevance. Verify conversion events and decide who approves creative changes and advertising spend.",
        "acceptance": "Check settings, destination URLs, tracking and budget controls before launch. Report actual spend, conversions and data limitations; cost per lead and return cannot be fixed in advance.",
    },
    "S13": {
        "label": "WhatsApp Business automation",
        "intro": "Connect WhatsApp Business messaging to a defined service or notification workflow. Establish account setup, consent and human handoff before implementing automation.",
        "focus": "Identify templates, triggering events, CRM connections and opt-out handling. Provider setup, template review and messaging charges are dependencies to confirm for the chosen account.",
        "acceptance": "Test consent, webhook retries, duplicate events and agent handoff. Record delivery failures and avoid treating an accepted API request as proof of recipient delivery.",
    },
    "S14": {
        "label": "landing page design",
        "intro": "Build a campaign page around one audience, a clear offer and an understandable next step. Answer the visitor's main questions before asking for an enquiry.",
        "focus": "Agree the message hierarchy, evidence, forms and tracking. Identify approved claims and assets and those needing further support.",
        "acceptance": "Check mobile layouts, form validation, enquiry delivery, keyboard access and analytics. Use an agreed experiment and adequate observations to evaluate conversion changes.",
    },
}


def _now():
    return datetime.now(timezone.utc).isoformat()


def _bullets(items):
    return "\n".join(f"• {item}" for item in items)


def profile_is_available(profile):
    return (profile.get("profileState") == "approved"
            and profile.get("capacityStatus") not in {"unavailable", "waitlist", "paused", "inactive"}
            and not profile.get("isDemo", False) and not profile.get("isTest", False))


def profile_delivery_coverage(profile, location=None):
    """Delivery permission comes from coverage, never inferred from home address."""
    modes, scope = profile.get("deliveryModes", []), profile.get("coverageScope")
    countries = profile.get("supportedCountries", [])
    onsite_locations = profile.get("onsiteLocations", [])
    remote = "remote" in modes and (scope == "worldwide_remote" or (
        scope == "country_remote" and (location.get("countryCode") in countries if location else bool(countries))))
    onsite = "onsite" in modes and (location["id"] in onsite_locations if location else bool(onsite_locations))
    return remote, onsite


def _matching_profiles(service, location, profiles):
    """A catalog match is not identity verification or a capacity guarantee."""
    eligible = [p for p in profiles if profile_is_available(p) and service["id"] in p.get("services", [])]
    remote, onsite = [], []
    for profile in eligible:
        is_remote, is_onsite = profile_delivery_coverage(profile, location)
        if is_remote:
            remote.append(profile)
        if is_onsite:
            onsite.append(profile)
    return remote, onsite


def generate_structured_page(service: dict, location: dict, available_freelancers: list, is_pilot=False) -> dict:
    location_path = canonical_location_path(location["canonicalPath"])
    canonical_path = f"{location_path}{service['slug']}/"
    page_id = f"page-{service['id'].lower()}-{location['id']}"
    loc_name = location["name"]
    guide = SERVICE_GUIDANCE.get(service["id"], {
        "label": service["title"].lower(),
        "intro": "Describe the business task, people involved and outcome you need before agreeing a scope.",
        "focus": "Document requirements, dependencies, deliverables and approvals in a written brief.",
        "acceptance": "Agree acceptance criteria, review the work against them and record handover responsibilities.",
    })
    label = guide["label"]
    remote, onsite = _matching_profiles(service, location, available_freelancers)
    delivery_modes = (["remote"] if remote else []) + (["onsite"] if onsite else [])
    if remote:
        availability = "Remote enquiries can be discussed with profiles whose approved service coverage includes this location. Confirm the individual's capacity and meeting times before making arrangements."
    else:
        availability = "Submit a project enquiry for availability review. The current catalog does not establish an eligible remote provider for this service and location."
    if onsite:
        availability += " Some profiles list this area for in-person work; confirm the exact meeting location and travel arrangements with the selected freelancer."
    else:
        availability += " In-person availability in this area has not been established."
    tz = verified_location_timezone(location)
    timezone_note = (
        f"The location catalog records {tz}. Confirm your working timezone and preferred meeting window in the brief; daylight-saving changes and freelancer availability may affect scheduling."
        if tz else "Include your working timezone and preferred meeting window in the brief so scheduling can be agreed."
    )
    exclusions = list(service.get("exclusions", []))
    if service["id"] == "S02":
        exclusions = ["App store developer account fees", "Ongoing server and cloud hosting bills"]
    elif service["id"] == "S13":
        exclusions = ["Unsolicited bulk messaging", "Messaging provider and Meta usage fees"]
    sections = [
        {"id": "sec-overview", "title": f"Planning {label}", "content": guide["intro"]},
        {"id": "sec-scope", "title": "Decisions to make before work starts", "content": guide["focus"]},
        {"id": "sec-deliverables", "title": "Deliverables to agree in your scope", "content": "The service catalog lists these options. The proposal should identify which are included and how they will be reviewed.\n" + _bullets(service.get("deliverables", []))},
        {"id": "sec-brief", "title": "Prepare your project brief", "content": _bullets([q["question"] for q in service.get("briefQuestions", [])])},
        {"id": "sec-pricing", "title": "How the quote is scoped", "content": "Request a scoped quote. These factors affect the work involved:\n" + _bullets(service.get("pricingFactors", [])) + "\nAgree the schedule, payment milestones, external charges and support terms in writing before work starts."},
        {"id": "sec-exclusions", "title": "Items to budget or arrange separately", "content": _bullets(exclusions) + "\nConfirm exclusions against the proposal; this page is not a fixed-price offer."},
        {"id": "sec-acceptance", "title": "Review and handover", "content": guide["acceptance"] + " Agree source-code or asset ownership, third-party licenses, account access and ongoing support in the project terms."},
        {"id": "sec-collaboration", "title": f"Working with clients in {loc_name}", "content": availability + "\n\n" + timezone_note + "\nA service area describes where work may be delivered; it does not establish a local office or a freelancer's home address."},
    ]
    if service.get("techOptions"):
        sections.insert(3, {"id": "sec-technology", "title": "Technology options to evaluate", "content": "Select tools around existing systems, maintainability and project needs. Options in the service catalog include:\n" + _bullets(service["techOptions"])})
    faqs = [
        {"question": f"What should I include in a {label} enquiry?", "answer": "Describe the goal, existing systems, intended users and preferred timeline. " + " ".join(q["question"] for q in service.get("briefQuestions", [])[:2])},
        {"question": f"Is a freelancer physically based in {loc_name}?", "answer": "This page does not establish physical residency or a local office. Check the individual's actual base and confirm requested in-person arrangements. " + availability},
        {"question": "How are price and delivery agreed?", "answer": "A quote and plan follow review of the brief, dependencies and available capacity. Payment milestones, external fees and support terms should be stated in the proposal."},
        {"question": "What will be checked before handover?", "answer": guide["acceptance"]},
        {"question": "Can we work in my timezone?", "answer": timezone_note},
    ]
    issues = [
        "Editorial review and publication approval are required.",
        "Confirm location facts, provider availability and business claims against evidence.",
        "This reusable service template does not establish independent location-page value; add supporting evidence or consolidate with a useful parent page.",
    ]
    content = {
        "schema_version": "1.0", "page_id": page_id, "service_id": service["id"],
        "location_id": location["id"], "locale": "en", "canonical_path": canonical_path,
        "seo": {
            "title": f"Freelance {label} for {loc_name} | ER Freelancer",
            "description": f"Explore freelance {label} for clients in {loc_name}. Review scope, project questions and delivery options, then request a scoped quote.",
            "primary_intent": f"hire-{service['slug']}",
            "secondary_phrases": [f"freelance {label}", f"{label} for {loc_name}"],
        },
        "hero": {"heading": f"Freelance {label} for {loc_name}", "summary": guide["intro"]},
        "delivery_modes": delivery_modes, "sections": sections,
        "brief_questions": [{"id": q["id"], "question": q["question"], "placeholder": q.get("placeholder", "")} for q in service.get("briefQuestions", [])],
        "faqs": faqs,
        "internal_link_ids": [f"/services/{service['slug']}/", location_path, "/freelancers/"],
        # A catalog ID alone is not evidence that a geographic fact was checked.
        "source_ids": [], "claims": [], "page_value_evidence": [],
        "direct_contact": {"phone": "+919711623561", "email": EMAIL, "whatsapp": "+919711623561"},
        "review": {"status": "pending", "issues": issues.copy()},
    }
    now = _now()
    return {
        "id": page_id, "serviceId": service["id"], "locationId": location["id"],
        "canonicalPath": canonical_path, "revision": 1, "lifecycleState": "needs_review",
        "indexable": False, "contentPackage": content,
        # Numeric for legacy clients; zero means unscored, not an SEO grade.
        "qualityScore": 0, "qualityAssessment": "not_scored", "qualityIssues": issues.copy(),
        "isPilot": is_pilot, "generatedAt": now, "publishedAt": None, "lastModifiedAt": now,
        "modelProvenance": {"engine": "service-brief-template-v2", "promptVersion": "not-applicable", "inputTokenEst": 0, "outputTokenEst": 0},
    }
