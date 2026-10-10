"""Pure URL helpers for the location-prefix migration.

Only individual geography URLs lose `/locations`; the directory itself stays
at `/locations/`. Mapping is not validation: callers must still check catalog
membership before serving or redirecting a URL.
"""
from copy import deepcopy
from urllib.parse import urlsplit, urlunsplit


def normalized_path(value):
    if not isinstance(value, str):
        return None
    try:
        parsed = urlsplit(value)
    except ValueError:
        return None
    path = parsed.path
    if parsed.scheme or parsed.netloc or "\\" in path or "\x00" in path or any(part in (".", "..") for part in path.split("/")):
        return None
    if not path.startswith("/"):
        path = "/" + path
    return path if path == "/" else path.rstrip("/") + "/"


def canonical_location_path(value):
    path = normalized_path(value)
    if path and path.startswith("/locations/") and path != "/locations/":
        return path[len("/locations"):]
    return path


def legacy_location_path(value):
    path = canonical_location_path(value)
    if path in (None, "/", "/locations/"):
        return path
    return "/locations" + path


def public_location_record(location):
    output = deepcopy(location)
    output["canonicalPath"] = canonical_location_path(location["canonicalPath"])
    if output.get("parentPath"):
        output["parentPath"] = canonical_location_path(output["parentPath"])
    # The supplied catalog repeats country-wide timezone values for many cities.
    # Keep the original import untouched, but don't present unsupported values.
    output["timezone"] = verified_location_timezone(location) or ""
    return output


def verified_location_timezone(location):
    evidence = location.get("timezoneVerification")
    if (isinstance(evidence, dict) and evidence.get("sourceUrl")
            and evidence.get("verifiedAt") and evidence.get("timezone") == location.get("timezone")):
        return location.get("timezone")
    return None


def rewrite_location_link(value):
    if not isinstance(value, str):
        return value
    parsed = urlsplit(value)
    if parsed.path.startswith("/locations/") and parsed.path != "/locations/":
        return urlunsplit((parsed.scheme, parsed.netloc, canonical_location_path(parsed.path), parsed.query, parsed.fragment))
    return value


def public_page_record(page):
    """Expose current URLs without rewriting existing database rows or history."""
    if not page:
        return None
    output = deepcopy(page)
    output["canonicalPath"] = canonical_location_path(page.get("canonicalPath"))
    package = output.get("contentPackage")
    if isinstance(package, dict):
        package["canonical_path"] = output["canonicalPath"]
        if isinstance(package.get("internal_link_ids"), list):
            package["internal_link_ids"] = [rewrite_location_link(value) if isinstance(value, str) and value.startswith("/locations/") else value
                                            for value in package["internal_link_ids"]]
        if isinstance(package.get("seo"), dict):
            for key in ("canonical", "canonicalUrl", "canonical_url"):
                if key in package["seo"]:
                    package["seo"][key] = rewrite_location_link(package["seo"][key])
    return output


def page_path_candidates(value):
    canonical = canonical_location_path(value)
    if canonical is None:
        return []
    return list(dict.fromkeys([canonical, legacy_location_path(canonical)]))


def preferred_page_records(records):
    """Mirror read lookup precedence before publication checks, even for drafts.

    If conflicting old/new rows exist, the current-path record wins. This avoids
    advertising a legacy published row when that current URL resolves to a draft.
    No record is updated, deleted, or automatically approved.
    """
    preferred = {}
    for record in sorted(records, key=lambda item: str(item.get("canonicalPath", "")).startswith("/locations/")):
        path = canonical_location_path(record.get("canonicalPath"))
        if path:
            preferred.setdefault(path, record)
    return list(preferred.values())
