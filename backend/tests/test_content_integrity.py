"""Regression checks for publication safety and truthful generated content."""
import importlib.util
import json
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "content_builder.py"
spec = importlib.util.spec_from_file_location("content_integrity_builder", MODULE_PATH)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


def service(service_id="S01"):
    return {
        "id": service_id, "slug": f"service-{service_id.lower()}", "title": "Catalog service",
        "deliverables": ["Agreed project deliverable"], "exclusions": ["External vendor fees"],
        "techOptions": ["Existing platform"], "pricingFactors": ["Integration scope"],
        "briefQuestions": [{"id": "goal", "question": "What is the project goal?", "placeholder": "Describe it"}],
    }


def location():
    return {
        "id": "loc-example", "name": "Example City", "canonicalPath": "/locations/example/",
        "countryCode": "GB", "countryName": "United Kingdom", "timezone": "Europe/London",
        "sourceId": "unverified-import-id", "parentId": "loc-parent",
    }


def profile(**overrides):
    return {
        "id": "profile-example", "profileState": "approved", "services": ["S01"],
        "capacityStatus": "available_now", "coverageScope": "worldwide_remote",
        "deliveryModes": ["remote"], **overrides,
    }


def test_generated_page_requires_review_even_with_available_profiles():
    page = builder.generate_structured_page(service(), location(), [profile()], is_pilot=True)
    assert page["lifecycleState"] == "needs_review"
    assert page["indexable"] is False
    assert page["publishedAt"] is None
    assert page["qualityAssessment"] == "not_scored"
    assert page["contentPackage"]["review"]["status"] == "pending"
    assert page["contentPackage"]["source_ids"] == []
    assert page["contentPackage"]["page_value_evidence"] == []
    assert any("independent location-page value" in issue for issue in page["qualityIssues"])


def test_catalog_match_does_not_invent_availability_or_expand_coverage():
    outside_country = profile(coverageScope="country_remote", supportedCountries=["IN"])
    unavailable = profile(capacityStatus="unavailable")
    parent_base = profile(deliveryModes=["onsite"], coverageScope="local_onsite", baseLocationId="loc-parent")
    pending = profile(profileState="under_review")
    page = builder.generate_structured_page(service(), location(), [outside_country, unavailable, parent_base, pending])
    assert page["contentPackage"]["delivery_modes"] == []
    assert "does not establish an eligible remote provider" in json.dumps(page)
    onsite = profile(deliveryModes=["onsite"], coverageScope="local_onsite", onsiteLocations=["loc-example"])
    page = builder.generate_structured_page(service(), location(), [profile(), onsite])
    assert page["contentPackage"]["delivery_modes"] == ["remote", "onsite"]


def test_all_service_drafts_avoid_previous_unsupported_claims():
    pages = [builder.generate_structured_page(service(key), location(), []) for key in builder.SERVICE_GUIDANCE]
    for page in pages:
        text = json.dumps(page).lower()
        for unsupported in ["1,500", "5.0 star", "40%", "60%", "within 24 hours", "sub-second", "near me", "verified local", "30-day", "escrow"]:
            assert unsupported not in text
        assert page["contentPackage"]["claims"] == []
    assert len({page["contentPackage"]["hero"]["summary"] for page in pages}) == 14
    assert "permission denial" in json.dumps(pages[1])
    assert "stock movements" in json.dumps(pages[8])
    assert "duplicate-event" in json.dumps(pages[10])


def test_existing_client_content_contract_is_preserved():
    page = builder.generate_structured_page(service(), location(), [])
    content = page["contentPackage"]
    assert content["schema_version"] == "1.0"
    assert content["canonical_path"] == page["canonicalPath"]
    assert isinstance(page["qualityScore"], int)
    for key in ["sections", "faqs", "brief_questions", "internal_link_ids", "source_ids", "claims", "page_value_evidence", "delivery_modes"]:
        assert isinstance(content[key], list)
    assert all({"id", "title", "content"} <= set(section) for section in content["sections"])
    assert all({"question", "answer"} <= set(faq) for faq in content["faqs"])
