"""Iteration 4 SEO regression: service-aware title/description + audit endpoint."""
import os
import requests
import pytest

BASE = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')


def test_pages_resolve_seo_service_aware():
    r = requests.get(f"{BASE}/api/pages/resolve", params={"path": "/locations/india/delhi/freelance-seo-expert/"}, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    page = data.get('page') or data
    seo = (page.get('contentPackage') or {}).get('seo') or {}
    title = seo.get('title', '')
    desc = seo.get('description', '')
    print("TITLE:", title)
    print("DESC:", desc)
    assert 0 < len(title) <= 95, f"title length invalid: {len(title)} -> {title}"
    assert 100 <= len(desc) <= 170, f"desc length invalid: {len(desc)} -> {desc}"
    assert 'seo' in title.lower() or 'search' in title.lower(), f"title not SEO-service-specific: {title}"
    assert 'website designer' not in desc.lower(), f"desc still generic: {desc}"
    assert 'seo' in desc.lower() or 'search' in desc.lower(), f"desc not SEO-service-specific: {desc}"


def test_seo_audit_clean():
    r = requests.get(f"{BASE}/api/seo/audit", params={"sample": 12}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    print("AUDIT:", data)
    assert data.get('errorCount', 1) == 0, f"errorCount not zero: {data}"
    assert data.get('titleLengthAlerts', 1) == 0, f"titleLengthAlerts not zero: {data}"
    assert data.get('descLengthAlerts', 1) == 0, f"descLengthAlerts not zero: {data}"


if __name__ == '__main__':
    test_pages_resolve_seo_service_aware()
    test_seo_audit_clean()
    print("ALL SEO TESTS PASS")
