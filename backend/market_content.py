"""Location-specific landing content built from a reviewed market-facts dataset.

Why this exists
---------------
The service-brief template in content_builder.py is deliberately generic, so its pages stay
noindex: swapping a place name into the same text is not a useful local page. This module adds
facts that genuinely differ by market and can be checked:

* the country's data-protection law (with an official source link where available),
  compliance notes, payment methods, marketplaces, channels and languages;
* a city profile (economy and typical project types);
* time-zone overlap and a suggested call window, computed from the IANA time-zone database.

The dataset lives in data/market_facts.json (reviewed date in its "reviewed" field) and
data/privacy_sources.json. Review both periodically — laws and payment methods change.

Indexing scope
--------------
LANDING_INDEX_SCOPE (env) decides which service × location pages are indexable:
  "country-city-ncr" (default) countries, cities, and neighbourhoods of ONSITE_CITY_IDS
  "country-city"     countries and cities only
  "all"              every public location (not recommended: thin neighbourhood pages)
  "none"             previous behaviour — generated landing pages stay noindex
A stored page approved in the admin review workflow always wins; an explicitly withdrawn
stored page always stays noindex.
"""
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

from url_paths import canonical_location_path

DATA_DIR = Path(__file__).parent / "data"
_DATA = json.loads((DATA_DIR / "market_facts.json").read_text())
REVIEWED = _DATA["reviewed"]
COUNTRIES = _DATA["countries"]
CITIES = _DATA["cities"]
INDUSTRIES = _DATA["industries"]
SERVICE_ANGLES = _DATA["services"]
AREAS = _DATA.get("areas", {})  # neighbourhood profiles (on-site NCR areas)
_SOURCES_FILE = DATA_DIR / "privacy_sources.json"
PRIVACY_SOURCES = json.loads(_SOURCES_FILE.read_text()) if _SOURCES_FILE.exists() else {}

TEAM_TZ = "Asia/Kolkata"
TEAM_HOURS = {"start": 10, "end": 19, "call_start": 8, "call_end": 23}
ONSITE_CITY_IDS = set(filter(None, os.getenv(
    "ONSITE_CITY_IDS", "loc-city-in-delhi,loc-city-in-noida,loc-city-in-gurugram").split(",")))
MULTI_ZONE = {"US", "CA", "AU", "BR", "MX", "KZ", "ID", "CL"}

PRIVACY_SHORT = {
    "IN": "the DPDP Act", "PK": "privacy best practice", "BD": "Bangladesh's PDPA", "LK": "Sri Lanka's PDPA",
    "KZ": "Kazakhstan's data-localisation rules", "UZ": "Uzbekistan's data-localisation rules", "AE": "the UAE PDPL",
    "SA": "the Saudi PDPL", "QA": "Qatar's PDPPL", "KW": "CITRA's privacy regulation", "BH": "Bahrain's PDPL",
    "OM": "Oman's PDPL", "JO": "Jordan's PDPL", "GB": "UK GDPR", "DE": "GDPR", "FR": "GDPR", "NL": "GDPR", "ES": "GDPR",
    "IT": "GDPR", "IE": "GDPR", "CH": "the Swiss FADP", "SE": "GDPR", "PL": "GDPR", "US": "CCPA/CPRA and state privacy laws",
    "CA": "PIPEDA and Québec's Law 25", "BR": "the LGPD", "MX": "the LFPDPPP", "CO": "Law 1581 (Habeas Data)",
    "AR": "Law 25,326", "CL": "Chile's new data law", "SG": "Singapore's PDPA", "JP": "the APPI", "MY": "Malaysia's PDPA",
    "TH": "Thailand's PDPA", "ID": "the UU PDP", "VN": "Vietnam's PDP Law", "KR": "PIPA", "ZA": "POPIA", "NG": "the NDPA",
    "KE": "Kenya's Data Protection Act", "EG": "Egypt's PDPL", "AU": "the Privacy Act", "NZ": "the Privacy Act 2020",
}

# Industries where a service is most often bought — listed first when a city has them.
SERVICE_INDUSTRIES = {
    "S02": ["startups", "retail", "healthcare", "logistics"], "S05": ["healthcare", "realestate", "hospitality", "consulting", "education"],
    "S06": ["fashion", "hospitality", "retail", "media"], "S07": ["retail", "fashion", "textiles", "agriculture"],
    "S08": ["startups", "logistics", "finance", "healthcare"], "S09": ["manufacturing", "logistics", "textiles", "automotive", "pharma"],
    "S10": ["realestate", "finance", "education", "consulting"], "S11": ["finance", "logistics", "consulting", "healthcare"],
    "S12": ["realestate", "education", "healthcare", "retail"], "S13": ["retail", "healthcare", "hospitality", "realestate", "education"],
    "S14": ["realestate", "education", "startups", "healthcare"],
}


# ---------------------------------------------------------------- helpers
def list_join(items, conj="and"):
    items = [str(i) for i in items if i]
    if len(items) <= 1:
        return items[0] if items else ""
    return f"{', '.join(items[:-1])} {conj} {items[-1]}"


def lower_first(text):
    # Keep acronyms ("IT", "UPI"); lower-case ordinary words, including a leading "A ".
    return text if len(text) > 1 and text[0].isupper() and text[1].isupper() else text[:1].lower() + text[1:]


def clip(text, limit):
    if len(text) <= limit:
        return text
    cut = text[:limit - 1]
    return cut[:cut.rfind(" ")].rstrip(" ,.;:–—-") + "…"


def with_article(phrase):
    acronym = phrase.split(" ")[0].upper() in {"SEO", "SMO", "ERP", "SMS", "FAQ"}
    vowel = phrase[:1].lower() in "aeiou" and not phrase.lower().startswith(("uni", "use", "one", "euro"))
    return ("an " if acronym or vowel else "a ") + phrase


# Country names that take "the" in running text ("in the United Kingdom").
THE_COUNTRIES = {"United Kingdom", "United States", "United Arab Emirates", "Netherlands", "Philippines", "Czech Republic", "Maldives", "Bahamas", "Gambia"}


def the(name):
    return f"the {name}" if name in THE_COUNTRIES else name


def cap(text):
    return text[:1].upper() + text[1:]


def poss(name):
    return name + ("’" if name.endswith("s") else "’s")


def bullets(items):
    return "\n".join(f"• {item}" for item in items if item)


# ---------------------------------------------------------------- geography
def chain_of(location, loc_by_id):
    out, current, seen = [], location, {location["id"]}
    while current.get("parentId"):
        parent = loc_by_id.get(current["parentId"])
        if not parent or parent["id"] in seen:
            break
        out.insert(0, parent)
        seen.add(parent["id"])
        current = parent
    return out


def country_of(location, loc_by_id):
    return location if location.get("type") == "country" else (chain_of(location, loc_by_id) or [location])[0]


def city_of(location, loc_by_id):
    if location.get("type") == "city":
        return location
    if location.get("type") == "neighborhood":
        return loc_by_id.get(location.get("parentId"))
    return None


_CITY_STATES = {}


def _city_states(locations):
    key = id(locations)
    if key not in _CITY_STATES:
        cities = {}
        for loc in locations:
            if loc.get("type") == "city":
                cities.setdefault(loc.get("parentId"), []).append(loc)
        names = {l["id"]: l["name"] for l in locations if l.get("type") == "country"}
        _CITY_STATES[key] = {cid: group[0] for cid, group in cities.items()
                             if len(group) == 1 and group[0]["name"] == names.get(cid)}
    return _CITY_STATES[key]


def city_state_city(country, locations):
    """Singapore-style countries: one city with the country's own name (publish only one level)."""
    return _city_states(locations).get(country["id"])


def _scope():
    return os.getenv("LANDING_INDEX_SCOPE", "country-city-ncr").strip().lower()


def location_indexable(location, locations):
    """Hub pages and service × location pages share one indexing rule."""
    scope = _scope()
    if not location or scope == "none":
        return False
    # Only markets covered by the reviewed dataset get indexable generated content.
    if location.get("countryCode") not in COUNTRIES:
        return False
    kind = location.get("type")
    if kind == "country":
        return True
    if kind == "city":
        twin = _city_states(locations).get(location.get("parentId"))
        return not (twin and twin["id"] == location["id"])
    if kind == "neighborhood":
        return scope == "all" or (scope == "country-city-ncr" and location.get("parentId") in ONSITE_CITY_IDS)
    return False


def hub_indexable(location, locations):
    # With scope "none" hubs keep their previous behaviour (indexable); only landing pages change.
    if _scope() == "none":
        return True
    return location_indexable(location, locations)


def place_name(location, loc_by_id, long=False):
    if location.get("type") == "neighborhood":
        parent = loc_by_id.get(location.get("parentId"))
        return f"{location['name']}, {parent['name']}" if parent else location["name"]
    if location.get("type") == "country":
        return the(location["name"])
    if not long or location["name"] == location.get("countryName"):
        return location["name"]
    return f"{location['name']}, {location['countryName']}"


# ---------------------------------------------------------------- time zones
def _offset_minutes(tz, when):
    return int(when.astimezone(ZoneInfo(tz)).utcoffset().total_seconds() // 60)


def _fmt_offset(minutes):
    sign = "+" if minutes >= 0 else "−"
    h, m = divmod(abs(minutes), 60)
    return f"UTC{sign}{h}" + (f":{m:02d}" if m else "")


def _fmt_hour(hour):
    hour %= 24
    h = int(hour + 1e-9)
    return f"{h:02d}:{round((hour - h) * 60):02d}"


def _fmt_duration(minutes):
    h, m = divmod(abs(minutes), 60)
    return " ".join(filter(None, [f"{h} h" if h else "", f"{m} min" if m else ""])) or "0 h"


def _overlap(a_start, a_end, b_start, b_end):
    return max(0.0, max(min(a_end, b_end + s) - max(a_start, b_start + s) for s in (-24, 0, 24)))


def _window(a_start, a_end, b_start, b_end):
    best = None
    for s in (-24, 0, 24):
        lo, hi = max(a_start, b_start + s), min(a_end, b_end + s)
        if hi > lo and (not best or hi - lo > best[1] - best[0]):
            best = (lo, hi)
    return best


def timezone_info(tz):
    year = int(REVIEWED[:4])
    samples = [datetime(year, 1, 15, 12, tzinfo=timezone.utc), datetime(year, 7, 15, 12, tzinfo=timezone.utc)]
    offsets = [_offset_minutes(tz, d) for d in samples]
    team = [_offset_minutes(TEAM_TZ, d) for d in samples]
    diffs = [t - o for t, o in zip(team, offsets)]
    uniq = sorted(set(offsets))
    label = _fmt_offset(uniq[0]) if len(uniq) == 1 else f"{_fmt_offset(uniq[0])} / {_fmt_offset(uniq[1])} (seasonal)"
    same = all(d == 0 for d in diffs)
    ud = sorted(set(diffs))
    if same:
        diff_label = "Same time zone as our team (IST)"
    elif all(d > 0 for d in ud):
        diff_label = "IST is " + " – ".join(_fmt_duration(d) for d in ud) + " ahead"
    elif all(d < 0 for d in ud):
        diff_label = "IST is " + " – ".join(_fmt_duration(d) for d in reversed(ud)) + " behind"
    else:
        diff_label = "The difference to IST changes with daylight saving"
    h = TEAM_HOURS
    core = min(_overlap(9, 18, h["start"] - d / 60, h["end"] - d / 60) for d in diffs)
    worst = max(diffs, key=abs)
    call = None
    if same:
        call = (f"{_fmt_hour(h['start'])}–{_fmt_hour(h['end'])}", f"{_fmt_hour(h['start'])}–{_fmt_hour(h['end'])}")
    else:
        w = _window(8, 20, h["call_start"] - worst / 60, h["call_end"] - worst / 60)
        if w:
            length = min(w[1] - w[0], 3)
            call = (f"{_fmt_hour(w[0])}–{_fmt_hour(w[0] + length)}", f"{_fmt_hour(w[0] + worst / 60)}–{_fmt_hour(w[0] + length + worst / 60)}")
    return {"tz": tz, "label": label, "same": same, "diff": diff_label, "overlap": round(core * 2) / 2, "call": call}


def _tz_for(location, loc_by_id):
    city = city_of(location, loc_by_id)
    if city and CITIES.get(city["id"], {}).get("timezone"):
        return CITIES[city["id"]]["timezone"]
    country = country_of(location, loc_by_id)
    return COUNTRIES.get(country.get("countryCode"), {}).get("timezone") or "UTC"


def timezone_paragraph(location, loc_by_id, place):
    info = timezone_info(_tz_for(location, loc_by_id))
    tail = " Between calls you get written updates and a staging link that shows the latest build."
    if info["same"]:
        return f"{cap(place)} is on Indian Standard Time, the same as our team, so calls and reviews happen during normal business hours." + tail, info
    if location.get("type") == "country" and location.get("countryCode") in MULTI_ZONE:
        city = info["tz"].split("/")[-1].replace("_", " ")
        example = f"{info['call'][0]} in {city} ({info['call'][1]} IST)" if info["call"] else f"a morning slot in {city}"
        return f"{cap(place)} spans several time zones, so a fixed daily call slot is agreed for your city — for example {example}." + tail, info
    overlap = (f"That leaves roughly {info['overlap']:g} hours of overlap with a 9-to-6 working day."
               if info["overlap"] > 0 else "There is little natural overlap, so a fixed call slot is agreed and work continues while you are offline.")
    call = f" A daily call at {info['call'][0]} your time ({info['call'][1]} IST) works year-round." if info["call"] else ""
    return f"{cap(place)} is on {info['label']}. {info['diff']}. {overlap}{call}" + tail, info


def timezone_short(location, info, place):
    """One-line answer for the FAQ, so it doesn't repeat the full working-hours section."""
    if info["same"]:
        return f"Indian Standard Time — {place} and our team share the same working day."
    if location.get("type") == "country" and location.get("countryCode") in MULTI_ZONE:
        return f"A daily call slot is fixed for your own city's time zone; {place} spans several zones."
    if info["call"]:
        return f"Calls run {info['call'][0]} your time ({info['call'][1]} IST); everything else is asynchronous, with written updates."
    return "A fixed call slot is agreed at the start; everything else is asynchronous, with written updates."


# ---------------------------------------------------------------- market facts
def _facts(location, loc_by_id):
    country = country_of(location, loc_by_id)
    return country, COUNTRIES.get(country.get("countryCode"))


# How each law reads after "planned around …" when "the" + its name would be wrong.
PRIVACY_REF = {
    "PK": "GDPR-style privacy practice (Pakistan’s Personal Data Protection Bill is still a draft)",
    "US": "state privacy laws such as California’s CCPA/CPRA",
    "CA": "PIPEDA and, for Québec, Law 25",
    "CL": "Law 19,628 and the incoming Law 21,719 (in force from December 2026)",
}


def privacy_ref(code, facts):
    if code in PRIVACY_REF:
        return PRIVACY_REF[code]
    name = facts["privacy"]
    return name if name.startswith(("Law ", "PIPEDA")) else "the " + name


def source_line(code):
    src = PRIVACY_SOURCES.get(code) or {}
    return f"Source: {src['label']} — {src['url']}" if src.get("url") else ""


def requirement_bullets(facts, focus, country_name):
    seen, out = set(), []

    def push(text):
        if text and text not in seen:
            seen.add(text)
            out.append(text)
    english_only = facts["languages"] == ["English"]
    for item in focus:
        if item == "privacy":
            push(f"{facts['privacy']}: {facts['privacyNote']}")
        elif item == "web":
            for note in facts.get("web", []):
                push(note)
        elif item == "payments":
            push(f"Payment methods customers in {country_name} expect: {list_join(facts['payments'])}.")
        elif item == "commerce":
            push(f"Marketplaces and platforms that can be connected: {list_join(facts['commerce'])}.")
        elif item == "channels":
            push(f"Channels that matter most in {country_name}: {list_join(facts['channels'])}.")
        elif item == "search":
            push(facts.get("search") or f"Google is the main search engine in {country_name}; plan content in {list_join(facts['languages'][:2])} and consider a {facts['tld']} domain where it helps.")
        elif item == "languages" and not english_only:
            rtl_covered = any("right-to-left" in note for note in out)
            push(f"Interface and content languages: {list_join(facts['languages'])}" + (", with proper right-to-left (RTL) layouts." if facts.get("rtl") and not rtl_covered else "."))
    return out


def industry_lines(industries, category, service_id=None, limit=4):
    boost = SERVICE_INDUSTRIES.get(service_id or "", [])
    ranked = sorted(industries, key=lambda i: 0 if i in boost else 1)
    return [f"{INDUSTRIES[i]['label']}: {INDUSTRIES[i][category]}." for i in ranked[:limit] if i in INDUSTRIES]


def _local_focus(focus, facts):
    english_only = facts["languages"] == ["English"]
    order = list(focus) + ["privacy", "payments", "channels", "search", "languages"]
    picked = []
    for item in order:
        item = "languages" if item == "web" else item
        if item == "languages" and english_only:
            continue
        if item == "search" and english_only and not facts.get("search"):
            continue
        if item not in picked:
            picked.append(item)
    return picked[:2]


def _local_faq(item, facts, country_name, code):
    if item == "privacy":
        src = PRIVACY_SOURCES.get(code) or {}
        ref = f" Official reference: {src['url']}" if src.get("url") else ""
        return {"question": f"Will the project follow {PRIVACY_SHORT.get(code, 'local privacy rules')} in {country_name}?",
                "answer": f"The build is planned around {privacy_ref(code, facts)}: consent capture on forms, a clear privacy notice, data minimisation and suitable hosting. {facts['privacyNote']} Final legal wording should be checked by your legal adviser.{ref}"}
    if item == "payments":
        return {"question": f"Which payment methods can be integrated for {country_name}?",
                "answer": f"Common options include {list_join(facts['payments'])}. Gateways are chosen around your customers, settlement currency ({facts['currency']}) and fees, and the full checkout is tested on mobile."}
    if item == "commerce":
        return {"question": f"Can a store be connected to marketplaces used in {country_name}?",
                "answer": f"Yes — products, stock and orders can be synced with {list_join(facts['commerce'])} where their APIs allow it."}
    if item == "channels":
        return {"question": f"Which platforms matter most for audiences in {country_name}?",
                "answer": f"For most audiences the priority channels are {list_join(facts['channels'][:4])}. This is confirmed against your own customers and competitors before planning content or automation."}
    if item == "search":
        return {"question": f"Is local-language SEO covered for {country_name}?",
                "answer": f"{facts.get('search') or 'Google is the main search engine in ' + country_name + '.'} Keyword research covers {list_join(facts['languages'][:2])}, with hreflang where several languages are targeted."}
    return {"question": f"Can the project be built in {list_join(facts['languages'][:2], 'or')}?",
            "answer": f"Yes. Multilingual builds support {list_join(facts['languages'])} content" + (" with right-to-left (RTL) layouts" if facts.get("rtl") else "") + ", translated URLs where useful and hreflang tags."}


def delivery_sentence(location, loc_by_id, info, place):
    city = city_of(location, loc_by_id)
    if location.get("type") == "country" and location.get("countryCode") in MULTI_ZONE:
        return f"Projects for {place} run remotely, with a daily call window agreed for your city's time zone."
    if city and city["id"] in ONSITE_CITY_IDS:
        return f"Projects for {place} can start with an in-person discovery meeting in Delhi NCR on request, or run fully remotely."
    if info["same"]:
        return f"Projects for {place} run remotely in the same time zone (IST), with calls during normal business hours."
    if info["overlap"] >= 2:
        return f"Projects for {place} run remotely, with about {info['overlap']:g} hours of overlap with a 9-to-6 working day."
    call = f" — {info['call'][0]} your time ({info['call'][1]} IST)" if info["call"] else ""
    return f"Projects for {place} run remotely with a fixed daily call window{call}."


def market_profile(location, loc_by_id, locations):
    """Most specific reviewed profile: neighbourhood, else its city, else a city-state's city."""
    if location.get("type") == "neighborhood" and location["id"] in AREAS:
        return AREAS[location["id"]]
    city = city_of(location, loc_by_id) or (city_state_city(location, locations) if location.get("type") == "country" else None)
    return CITIES.get(city["id"]) if city else None


def country_city_lines(country, locations, limit=10):
    """For country pages: the cities covered, each with its reviewed one-line profile."""
    twin = city_state_city(country, locations)
    cities = sorted([l for l in locations if l.get("type") == "city" and l.get("parentId") == country["id"]
                     and l["id"] in CITIES and not (twin and twin["id"] == l["id"])], key=lambda l: l["name"])
    return [f"{l['name']}: {lower_first(CITIES[l['id']]['note']).rstrip('.')}." for l in cities[:limit]]


# ---------------------------------------------------------------- landing page
def build_market_page(service, location, loc_by_id, locations, guide, profiles_remote=0):
    """Return a page record in the same shape as content_builder.generate_structured_page."""
    country, facts = _facts(location, loc_by_id)
    if not facts:
        return None
    angle = SERVICE_ANGLES.get(service["id"], {})
    short = angle.get("short", service["title"])
    noun = angle.get("noun", service["title"].lower())
    category = angle.get("category", "web")
    code = country.get("countryCode")
    place = place_name(location, loc_by_id)
    place_long = place_name(location, loc_by_id, long=True)
    location_path = canonical_location_path(location["canonicalPath"])
    canonical_path = f"{location_path}{service['slug']}/"
    tz_text, info = timezone_paragraph(location, loc_by_id, place)
    city = city_of(location, loc_by_id) or (city_state_city(location, locations) if location.get("type") == "country" else None)
    profile = market_profile(location, loc_by_id, locations)
    industries = (profile or {}).get("industries") or facts.get("industries", [])
    indexable = location_indexable(location, locations)
    cname = the(country["name"])
    sub_country = location.get("type") != "country"

    title = f"Freelance {short} in {place}"
    title = title + " | ER Freelancer" if len(title) <= 50 else title
    value = angle.get('value', service['title'].lower())
    description = f"Freelance {noun} for {place_long}: {value}. Planned for {PRIVACY_SHORT.get(code, 'local rules')}, local payments and your time zone."
    if len(description) > 158:
        description = f"Freelance {noun} for {place_long}: {value}. Planned for {PRIVACY_SHORT.get(code, 'local rules')} and local payments."
    description = clip(description, 160)
    summary = f"{angle.get('summary', guide['intro'])} {delivery_sentence(location, loc_by_id, info, place)} Scope, milestones and ownership are agreed in writing before work starts."

    requirements = requirement_bullets(facts, angle.get("localFocus", ["privacy", "web"]), cname)
    if sub_country and len(requirements) > 3:
        # The country page carries the full list; cities keep the three that matter most.
        requirements = requirements[:3] + [f"The full list for {cname} is on the {short} in {cname} page."]
    src = source_line(code)
    sections = [
        {"id": "sec-local", "title": f"{country['name']}-specific requirements to plan for",
         "content": f"Projects for businesses in {place} have to work for local customers and local rules. These points are planned from the first milestone:\n"
                    + bullets(requirements) + ("\n" + src if src else "") + "\nThis is practical delivery guidance, not legal advice."},
        {"id": "sec-projects", "title": f"Typical {noun} projects for businesses in {place}",
         "content": ((profile or {}).get("note") or f"{poss(cap(cname))} key sectors include {list_join([INDUSTRIES[i]['label'].lower() for i in industries[:4] if i in INDUSTRIES])}.")
                    + "\n" + bullets(industry_lines(industries, category, service["id"]))},
        *([{"id": "sec-cities", "title": f"{short} for businesses across {cname}",
             "content": f"Projects are planned for the market each business sells into. Cities covered in {cname}:\n" + bullets(city_lines)}]
          if (city_lines := country_city_lines(location, locations) if location.get("type") == "country" else []) else []),
        *([{"id": "sec-area", "title": f"Working with businesses in {place}",
             "content": f"{location['name']} is in {city['name']}, one of the cities where an in-person discovery meeting is possible on request. "
                        f"The first meeting can be held at your office in {location['name']}; reviews, approvals and handover then run over video calls, shared staging links and written sign-off."}]
          if location.get("type") == "neighborhood" and city and city["id"] in ONSITE_CITY_IDS else []),
        {"id": "sec-timezone", "title": f"Working hours: India ↔ {place}", "content": tz_text},
        {"id": "sec-scope", "title": "Decisions to make before work starts", "content": guide["focus"]},
        {"id": "sec-deliverables", "title": "Deliverables to agree in your scope", "content": bullets(service.get("deliverables", []) + angle.get("outcomes", []))},
        {"id": "sec-technology", "title": "Technology options", "content": bullets(service.get("techOptions", []))},
        {"id": "sec-brief", "title": "Questions for your project brief", "content": bullets([q["question"] for q in service.get("briefQuestions", [])])},
        {"id": "sec-pricing", "title": "How the quote is scoped", "content": "These factors affect the work involved:\n" + bullets(service.get("pricingFactors", []))
                    + f"\nShare your budget in {facts['currency']} or USD. The schedule, payment milestones, external charges and support terms are agreed in writing before work starts."},
        {"id": "sec-acceptance", "title": "Review and handover", "content": guide["acceptance"] + " Source-code and asset ownership, licences, account access and ongoing support are set out in the project terms."},
    ]
    # City and neighbourhood pages keep the market-specific material and leave the
    # service-wide reference lists (technology, brief questions) to the country and
    # service pages, so pages inside one country don't repeat the same blocks.
    if sub_country:
        sections = [s for s in sections if s["id"] not in ("sec-technology", "sec-brief")]
        for s in sections:
            if s["id"] == "sec-pricing":
                s["content"] += f"\nTechnology options and brief questions for this service are listed on the {service['title']} page."
    sections = [s for s in sections if s["content"].strip()]
    onsite = bool(city and city["id"] in ONSITE_CITY_IDS)
    ranked = [i for i in sorted(industries, key=lambda i: 0 if i in SERVICE_INDUSTRIES.get(service["id"], []) else 1) if i in INDUSTRIES]
    local_items = _local_focus(angle.get("localFocus", []), facts)[:1 if sub_country else 2]
    faqs = [
        {"question": f"Can I hire a freelance {noun} for a project in {place}?",
         "answer": "Yes. Share your goals, timeline and budget and you receive clarifying questions or a scoped, milestone-based proposal. "
                   + ("An in-person discovery meeting in Delhi NCR is possible on request." if onsite else "Work runs remotely, with written updates and a staging link you can review at any time.")},
        {"question": f"How much does a freelance {noun} cost in {place}?",
         "answer": f"It depends on {list_join([lower_first(f) for f in service.get('pricingFactors', [])[:4]])}. There are no fixed packages: share your budget in {facts['currency']} or USD and receive an itemised, milestone-based proposal."},
        {"question": f"How long does {angle.get('project', 'a project')} take?",
         "answer": f"The service catalog lists a typical range of {service.get('typicalTimelineDays', 'a few weeks')}; the real plan depends on scope, integrations and content readiness."},
        *[_local_faq(item, facts, cname, code) for item in local_items],
        *([{"question": f"What does a typical project for {lower_first(INDUSTRIES[ranked[0]]['label'])} in {place} look like?",
            "answer": f"Usually {INDUSTRIES[ranked[0]][category]}. The exact scope follows your customers, existing systems and budget, and is agreed in writing before work starts."}]
          if sub_country and ranked else []),
        {"question": f"Which time zone will the project run in for {place}?", "answer": timezone_short(location, info, place)},
    ]
    evidence = [s for s in [(PRIVACY_SOURCES.get(code) or {}).get("url"), "IANA Time Zone Database (zoneinfo)"] if s]
    published = f"{REVIEWED}T00:00:00+00:00"
    content = {
        "schema_version": "1.0", "page_id": f"page-{service['id'].lower()}-{location['id']}", "service_id": service["id"],
        "location_id": location["id"], "locale": "en", "canonical_path": canonical_path,
        "seo": {"title": title, "description": description, "primary_intent": f"hire-{service['slug']}", "indexable": indexable,
                "secondary_phrases": [f"freelance {noun} {place}", f"{noun} in {place}"]},
        "hero": {"heading": f"Freelance {short} in {place}", "summary": summary},
        "delivery_modes": ["remote"] + (["onsite"] if onsite else []),
        "sections": sections,
        "brief_questions": [{"id": q["id"], "question": q["question"], "placeholder": q.get("placeholder", "")} for q in service.get("briefQuestions", [])],
        "faqs": faqs,
        "internal_link_ids": [f"/services/{service['slug']}/", location_path],
        "source_ids": evidence, "claims": [], "page_value_evidence": [s["id"] for s in sections[:3]],
        "direct_contact": {"phone": "+918800774388", "email": "hello@erfreelancer.com", "whatsapp": "+918800774388"},
        "review": {"status": "passed" if indexable else "pending", "issues": []},
    }
    return {
        "id": content["page_id"], "serviceId": service["id"], "locationId": location["id"], "canonicalPath": canonical_path,
        "revision": 1, "lifecycleState": "published" if indexable else "needs_review", "indexable": indexable,
        "contentPackage": content, "qualityScore": 0, "qualityAssessment": "not_scored", "qualityIssues": [],
        "isPilot": False, "generatedAt": published, "publishedAt": published if indexable else None, "lastModifiedAt": published,
        "editorialReview": {"approved": indexable, "method": "market-facts-dataset", "reviewedAt": REVIEWED, "evidence": evidence},
        "modelProvenance": {"engine": "market-facts-v3", "promptVersion": "not-applicable", "inputTokenEst": 0, "outputTokenEst": 0},
    }


# ---------------------------------------------------------------- hub sections
def location_sections(location, loc_by_id, locations):
    """Extra, market-specific sections for country / city / neighbourhood hub pages."""
    country, facts = _facts(location, loc_by_id)
    if not facts:
        return []
    code = country.get("countryCode")
    place = place_name(location, loc_by_id)
    profile = market_profile(location, loc_by_id, locations)
    industries = (profile or {}).get("industries") or facts.get("industries", [])
    tz_text, _ = timezone_paragraph(location, loc_by_id, place)
    src = source_line(code)
    cname = the(country["name"])
    at_a_glance = [
        f"Currency: {facts['currencyName']} ({facts['currency']})",
        f"Business languages: {list_join(facts['languages'][:3])}",
        f"Privacy law: {facts['privacy']}",
        f"Popular payment methods: {list_join(facts['payments'][:4])}",
        f"Key channels: {list_join(facts['channels'][:4])}",
        f"Country domain: {facts['tld']} · dialling code {facts['dial']}",
    ]
    return [
        {"heading": f"{cap(place)} at a glance", "body": bullets(at_a_glance)},
        {"heading": f"Who we work with in {place}",
         "body": ((profile or {}).get("note") or f"{poss(cap(cname))} key sectors include {list_join([INDUSTRIES[i]['label'].lower() for i in industries[:4] if i in INDUSTRIES])}.")
                 + "\n" + bullets([f"{INDUSTRIES[i]['label']}: {INDUSTRIES[i]['web']}; {INDUSTRIES[i]['growth']}." for i in industries[:4] if i in INDUSTRIES])},
        {"heading": f"Building for {cname}: what projects plan for",
         "body": bullets([f"{facts['privacy']}: {facts['privacyNote']}", *facts.get("web", []), f"Marketplaces: {list_join(facts['commerce'])}.", facts.get("search", "")])
                 + ("\n" + src if src else "")},
        {"heading": "Time zones and communication", "body": tz_text},
    ]


def market_faqs(location, loc_by_id):
    country, facts = _facts(location, loc_by_id)
    if not facts:
        return []
    place = place_name(location, loc_by_id)
    _, info = timezone_paragraph(location, loc_by_id, place)
    return [
        {"question": f"Do you work with clients in {place}?", "answer": delivery_sentence(location, loc_by_id, info, place)},
        {"question": f"How do payments work for clients in {the(country['name'])}?",
         "answer": f"Projects are split into milestones agreed in writing. You can discuss your budget in {facts['currency']} or USD, and checkout integrations can use {list_join(facts['payments'][:3])}."},
        {"question": f"Do projects account for {poss(the(country['name']))} privacy rules?",
         "answer": f"Yes — builds are planned around {privacy_ref(country.get('countryCode'), facts)}. {facts['privacyNote']} Final legal wording should be reviewed by your adviser."},
    ]
