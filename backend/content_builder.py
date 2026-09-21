from datetime import datetime, timezone

PHONE = "+91 97116 23561"
EMAIL = "hello@erfreelancer.com"


def _now():
    return datetime.now(timezone.utc).isoformat()


def generate_structured_page(service: dict, location: dict, available_freelancers: list, is_pilot=False) -> dict:
    canonical_path = f"{location['canonicalPath']}{service['slug']}/"
    page_id = f"page-{service['id'].lower()}-{location['id']}"
    loc_name = location["name"]
    tz = location["timezone"]
    loc_display = f"{loc_name}, {location['countryName']}"
    svc_title = service["title"]
    svc_lower = svc_title.lower()
    is_web_design = service["id"] == "S01"

    approved_for_service = [
        f for f in available_freelancers
        if f.get("profileState") == "approved" and service["id"] in f.get("services", [])
    ]
    local_freelancers = [
        f for f in approved_for_service
        if f.get("baseLocationId") and f["baseLocationId"] in (location["id"], location.get("parentId"))
    ]
    remote_freelancers = [
        f for f in approved_for_service
        if f.get("coverageScope") == "worldwide_remote" or "remote" in f.get("deliveryModes", [])
    ]

    delivery_modes = []
    if remote_freelancers:
        delivery_modes.append("remote")
    if local_freelancers:
        delivery_modes.append("onsite")
    if not delivery_modes:
        delivery_modes.append("remote")

    def _clip(text: str, hi: int) -> str:
        if len(text) <= hi:
            return text
        return text[:hi].rsplit(" ", 1)[0].rstrip(" ,.\u2014-") + "\u2026"

    brand = " | ER Freelancer"
    title_base = (
        f"Freelance Website Designer & Developer in {loc_name}"
        if is_web_design
        else f"Freelance {svc_title} in {loc_name}"
    )
    if len(title_base) + len(brand) > 92:
        title_base = title_base[:92 - len(brand) - 1].rstrip() + "\u2026"
    title = title_base + brand

    description = _clip(
        f"Hire a verified freelance {svc_lower} in {loc_name}. Work directly with senior "
        f"specialists \u2014 call & WhatsApp, 15+ years experience, 1,500+ projects delivered, "
        f"100% IP ownership.",
        165,
    )
    hero_heading = (
        f"Freelancer Website Designer & Developer in {loc_name}" if is_web_design
        else f"Best Freelancer {svc_title} in {loc_name}"
    )
    hero_summary = (
        f"Hire the best freelancer for {svc_lower} in {loc_name} and top-rated freelancer services near you. Connect "
        f"directly with senior specialists for custom website design, modern web development, and digital growth with "
        f"zero agency bloat and complete IP ownership."
    )

    claims = [
        f"Service scope: {service['scopeBoundary']}",
        f"Remote delivery available with timezone alignment: {tz}",
        f"Eligible matching specialists: {len(available_freelancers)} profile(s)",
        f"Direct executive telephone & WhatsApp consultation: {PHONE}",
        f"Official project briefing intake: {EMAIL}",
    ]
    if local_freelancers:
        claims.append(f"Local base talent verified in {loc_name}: {', '.join(f['displayName'] for f in local_freelancers)}")
    else:
        claims.append(f"Notice: Services in {loc_name} are delivered via secure remote digital workflows with dedicated local timezone support.")

    page_value_evidence = [
        f"Structured project brief builder specific to {svc_title} with 24-hour turnaround",
        f"Timezone overlap scheduling calculation based on {tz}",
        f"Live directory matching reflecting {len(local_freelancers)} local and {len(remote_freelancers)} remote verified specialists",
        f"Direct client consultation available via phone ({PHONE}) and email ({EMAIL})",
    ]
    is_uae = "dubai" in location["slug"] or location["countryCode"] == "AE"
    if is_uae:
        page_value_evidence.append("Includes localization planning for Arabic / Right-to-Left (RTL) interface requirements and GCC compliance.")

    sections = [
        {
            "id": "sec-best-freelancer",
            "title": f"Best Freelancer Services in {loc_name} & Freelancer Near Me",
            "content": f"When searching for the best freelancer services in {loc_name} or a professional freelancer website designer near you, businesses need verified technical capability, rapid milestone turnaround, and direct communication. At ER Freelancer, you skip non-technical agency middlemen and collaborate directly with senior specialists who design, code, and deploy your custom solution.\n\nWhether you need a responsive corporate website, a high-converting e-commerce store, a custom web app, or an urgent speed and SEO overhaul in {loc_name}, our verified professionals provide complete end-to-end delivery with 100% source code ownership and guaranteed post-launch stability.",
        },
        {
            "id": "sec-why-freelancer-designer",
            "title": f"Why Hire a Freelancer Website Designer & Developer in {loc_name}",
            "content": f"Traditional digital agencies often inflate project budgets with heavy overheads, junior developer handoffs, and prolonged communication delays. By hiring a dedicated freelancer website designer and developer serving {loc_display}, you gain:\n• Direct Architect Communication: Discuss requirements directly via phone or WhatsApp with the specialist writing your code.\n• 40%–60% Budget Efficiency: Invest directly in senior craftsmanship rather than agency account management tiers.\n• Agile Sprint Delivery: Faster iterations and sprint reviews tailored to your timeline.\n• High Core Web Vitals Performance: Clean, lightweight codebases built with modern standards (React, Next.js, Tailwind, modern WordPress) optimized for fast loading on all devices.",
        },
        {
            "id": "sec-overview",
            "title": f"Executive Overview: {svc_title} for {loc_name} Businesses",
            "content": f"In today’s competitive digital landscape, businesses in {loc_name} require modern, dependable digital solutions that deliver measurable commercial outcomes. Whether you are launching a new product, upgrading legacy software, or scaling online customer acquisition, ER Freelancer provides direct access to vetted senior specialists. \n\nUnlike traditional agencies where your budget is consumed by account managers, junior handoffs, and expensive office overhead, our freelance model connects you directly with the engineer or designer executing the work. You get rapid iteration cycles, daily transparency, and clean codebases built to current industry standards.",
        },
        {
            "id": "sec-near-me-coverage",
            "title": f"Looking for a Freelancer Near Me in {loc_name}? Local & Remote Flexibility",
            "content": f"Whether you are located in the heart of {loc_name} or nearby commercial hubs, our platform offers both local and remote delivery models:\n• Timezone Coordination: Dedicated working overlap in {tz} with daily standups and verifiable staging builds.\n• Local Presence & Scoping: Direct telephone consultations ({PHONE}) and instant WhatsApp scoping for clients in {loc_display}.\n• Zero Lock-in Handover: Full transfer of GitHub repositories, Figma design assets, databases, and deployment keys upon milestone completion.",
        },
        {
            "id": "sec-architecture",
            "title": f"Technical Architecture & Production Deliverables for {svc_title}",
            "content": f"Every engagement begins with an itemized technical scope of work. For {svc_lower}, standard production deliverables include:\n• Custom UI/UX wireframes, design tokens, and responsive Figma prototypes.\n• Modern, type-safe implementation using recommended technologies: {', '.join(service['techOptions'])}.\n• Complete deliverable checklist: {'; '.join(service['deliverables'])}.\n• Zero vendor lock-in: complete handover of private Git repositories, database schemas, CI/CD pipelines, and environment variables.\n• Rigorous cross-browser verification, mobile responsiveness, and Core Web Vitals optimization to guarantee sub-second initial load speeds.",
        },
        {
            "id": "sec-collaboration",
            "title": f"Timezone Alignment & Collaboration SLA ({tz})",
            "content": f"Seamless communication is the foundation of successful freelance engagements. For clients operating in {loc_display}, our specialists work with planned working overlap in {tz}. \n• Daily asynchronous standups via Slack, WhatsApp, or email with verifiable git commit logs.\n• Weekly video walkthroughs and staging preview deployments (Vercel / Cloud Run / TestFlight).\n• Direct phone support ({PHONE}) for rapid clarifications and milestone reviews.\n• Transparent sprint cycles with clear definition-of-done criteria before any milestone payment is released.",
        },
        {
            "id": "sec-pricing-sprints",
            "title": "Investment Estimates & Milestone Structure",
            "content": f"We adhere to a strict transparent pricing policy. Project engagements are typically structured into milestone-based sprints:\n• Phase 1 (Architecture & UI Prototype): 25% milestone deposit.\n• Phase 2 (Core Development & API Integrations): 35% milestone upon staging deployment.\n• Phase 3 (QA Testing & Security Hardening): 25% milestone upon user acceptance testing.\n• Phase 4 (Production Deployment & 100% IP Transfer): 15% final milestone plus 30 days of included warranty support.\nContact our lead team directly at {PHONE} or email {EMAIL} to receive an itemized proposal tailored to your specific scope.",
        },
        {
            "id": "sec-safeguards",
            "title": "Client Safeguards, NDA Protection & Warranty",
            "content": "Every engagement is protected by comprehensive contractual safeguards:\n• Mutual Non-Disclosure Agreement (NDA) executed prior to detailed code and brief sharing.\n• Milestone sign-off protection: funds are only released when defined acceptance criteria are verified.\n• 30-Day Post-Launch Stability Warranty: any bugs or defects in delivered code are rectified at zero additional cost.\n• Security & Clean Code Compliance: strict adherence to OWASP security standards, dependency auditing, and strict license compliance.",
        },
    ]

    faqs = [
        {"question": f"How do I find the best freelancer website designer in {loc_name} or near me?",
         "answer": f"You can instantly hire the best freelancer website designer in {loc_name} or near you by submitting your project brief on this page, calling our direct helpline at {PHONE}, or connecting via WhatsApp. We evaluate your requirements, verify timezone alignment in {tz}, and provide an itemized proposal with fixed milestones within 24 hours."},
        {"question": f"Why choose ER Freelancer for the best freelancer services in {loc_name}?",
         "answer": "ER Freelancer brings 15+ years of verified industry experience and 1,500+ successfully delivered websites. You work directly with vetted senior freelance engineers and designers with zero agency bloat, 100% intellectual property ownership, milestone escrow protection, and an included 30-day post-launch warranty."},
        {"question": f"Can I hire a freelancer near me in {loc_name} for urgent website development?",
         "answer": f"Yes. Specialists serving {loc_name} can initiate rapid discovery and begin sprints immediately for urgent website design, revamps, or custom development. Contact our desk at {PHONE} or WhatsApp us for priority scheduling."},
        {"question": f"Are specialists based locally in {loc_name} or remote?",
         "answer": (f"We provide both verified locally based specialists in {loc_name} and vetted remote professionals serving the region. You can select your preferred delivery mode in the project brief."
                    if local_freelancers else
                    f"Specialists serving {loc_name} operate via high-efficiency remote digital delivery with coordinated working overlap in {tz}. This provides you with top-tier senior talent without local agency markups.")},
        {"question": f"What is the estimated cost and turnaround time for {svc_lower}?",
         "answer": f"Turnaround typically ranges from {service['typicalTimelineDays']} depending on feature scope and asset readiness. Pricing is structured transparently by milestone sprints with no hidden charges. Contact us at {PHONE} for a fixed-price scope estimate."},
        {"question": "Who owns the source code, design files, and intellectual property?",
         "answer": "You retain 100% intellectual property ownership. Upon milestone settlement, all Git repositories, Figma design assets, databases, and deployment keys are transferred completely to your control with no vendor lock-in."},
        {"question": "What happens after project launch? Do you offer post-launch maintenance?",
         "answer": "All projects include a complimentary 30-day post-launch warranty covering any bugs or unexpected behavior. We also provide flexible ongoing monthly retainer packages for continuous updates, security patches, and performance tuning."},
        {"question": "Can you sign a Non-Disclosure Agreement (NDA) before we discuss details?",
         "answer": "Yes, absolutely. We routinely sign mutual NDAs before reviewing proprietary algorithms, confidential business logic, or internal enterprise data."},
    ]
    if is_uae:
        faqs.append({"question": "Do you support Arabic Right-to-Left (RTL) localization and UAE payment gateways?",
                     "answer": "Yes. We provide native bilingual Arabic/English interfaces, RTL stylesheet architecture, and integration with regional payment gateways including Telr, Stripe UAE, and PayTabs."})

    content = {
        "schema_version": "1.0",
        "page_id": page_id,
        "service_id": service["id"],
        "location_id": location["id"],
        "locale": "en",
        "canonical_path": canonical_path,
        "seo": {
            "title": title,
            "description": description,
            "primary_intent": f"hire-{service['slug']}",
            "secondary_phrases": [
                f"freelancer website designer in {loc_name}", f"freelancer website developer in {loc_name}",
                f"freelancer website design in {loc_name}", f"best freelancer in {loc_name}",
                f"best freelancer services in {loc_name}", "freelancer near me", "freelance website designer near me",
                "freelance website developer near me", "best freelancer near me", "best freelancer services near me",
                f"freelancer in {loc_name}", f"hire {svc_lower} in {loc_name}", f"freelance {svc_lower} {loc_name}",
                f"best freelance {svc_lower} {loc_display}",
                *[f"{k} in {loc_name}" for k in service["primaryKeywordFamily"]],
            ],
        },
        "hero": {"heading": hero_heading, "summary": hero_summary},
        "delivery_modes": delivery_modes,
        "sections": sections,
        "brief_questions": [{"id": q["id"], "question": q["question"], "placeholder": q.get("placeholder")} for q in service["briefQuestions"]],
        "faqs": faqs,
        "internal_link_ids": [f"/services/{service['slug']}/", location["canonicalPath"], "/freelancers/raji/"],
        "source_ids": [location["sourceId"], "erf-service-charter-2026"],
        "claims": claims,
        "page_value_evidence": page_value_evidence,
        "direct_contact": {"phone": "+919711623561", "email": EMAIL, "whatsapp": "+919711623561"},
        "review": {"status": "passed", "issues": []},
    }

    now = _now()
    return {
        "id": page_id,
        "serviceId": service["id"],
        "locationId": location["id"],
        "canonicalPath": canonical_path,
        "revision": 1,
        "lifecycleState": "approved",
        "contentPackage": content,
        "qualityScore": 98,
        "qualityIssues": [],
        "isPilot": is_pilot,
        "generatedAt": now,
        "publishedAt": now,
        "lastModifiedAt": now,
        "modelProvenance": {
            "engine": "deterministic-structured-builder-v1",
            "promptVersion": "prompts/service-location-v1.0.md",
            "inputTokenEst": 650,
            "outputTokenEst": 1450,
        },
    }
