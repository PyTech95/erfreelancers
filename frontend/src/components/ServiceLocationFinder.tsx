import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { Search, MapPin, Briefcase, ArrowRight, Sparkles, Filter, CheckCircle2, Globe } from 'lucide-react';
import { ServiceDefinition, LocationEntity } from '../types';

interface ServiceLocationFinderProps {
  services: ServiceDefinition[];
  onSelectServiceLocation: (service: ServiceDefinition, location: LocationEntity) => void;
  onOpenEnquiry: (serviceId: string, locationId: string) => void;
}

export const ServiceLocationFinder: React.FC<ServiceLocationFinderProps> = ({
  services,
  onSelectServiceLocation,
  onOpenEnquiry
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('S01');
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState<LocationEntity[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationEntity | null>(null);
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'remote' | 'onsite'>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Load initial representative locations
  useEffect(() => {
    fetchLocations('');
  }, []);

  const fetchLocations = async (q: string) => {
    setIsSearching(true);
    try {
      const res = await apiFetch(`/api/locations?q=${encodeURIComponent(q)}&limit=15`);
      const data = await res.json();
      setLocations(data.locations || []);
      if (!selectedLocation && data.locations?.length > 0) {
        // Default to Laxmi Nagar / Delhi (Primary founder hub) or first available
        const defaultLoc = data.locations.find((l: LocationEntity) => l.slug.includes('laxmi-nagar')) ||
          data.locations.find((l: LocationEntity) => l.slug.includes('delhi')) ||
          data.locations[0];
        setSelectedLocation(defaultLoc);
      }
    } catch (err) {
      console.error('Failed to query locations:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setDropdownOpen(true);
    fetchLocations(val);
  };

  const currentService = services.find(s => s.id === selectedServiceId) || services[0];

  const handleInspectPage = () => {
    if (currentService && selectedLocation) {
      onSelectServiceLocation(currentService, selectedLocation);
    }
  };

  return (
    <section id="search-finder" data-testid="service-location-finder" className="py-10 bg-slate-50/70 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <Search className="h-4 w-4" />
                <span>Best Freelancer Services Near Me • 3,600+ Cities</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mt-1">
                Find the Best Freelancer Services Near You
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Instantly connect with top-rated freelance website designers and developers in Delhi, Laxmi Nagar, or 3,600+ verified locations worldwide.
              </p>
            </div>

            {/* Delivery Mode Pills */}
            <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs self-start md:self-auto font-semibold">
              <button
                data-testid="finder-filter-all"
                onClick={() => setDeliveryFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  deliveryFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Specialists
              </button>
              <button
                data-testid="finder-filter-remote"
                onClick={() => setDeliveryFilter('remote')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  deliveryFilter === 'remote' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Remote
              </button>
              <button
                data-testid="finder-filter-onsite"
                onClick={() => setDeliveryFilter('onsite')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  deliveryFilter === 'onsite' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Locally Based
              </button>
            </div>
          </div>

          {/* Selector Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-6">
            
            {/* Service Dropdown (14 Options) */}
            <div className="md:col-span-5 text-left">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                1. Select Service (14 Core Categories)
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  data-testid="finder-service-select"
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-10 text-sm font-semibold text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-xs"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id} className="text-slate-900">
                      {`${s.id}: ${s.title} (${s.category})`}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* Location Autocomplete (3,600 Locations) */}
            <div className="md:col-span-5 text-left relative">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                2. Target City / Area (3,600 Verified Hubs)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-600 pointer-events-none" />
                <input
                  data-testid="finder-location-input"
                  type="text"
                  value={searchQuery || (selectedLocation ? `${selectedLocation.name}, ${selectedLocation.countryName}` : '')}
                  onChange={handleLocationSearchChange}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder="Type city or neighborhood (e.g. Vasant Kunj, Dubai Marina, Bengaluru)..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-xs"
                />
              </div>

              {/* Suggestions Dropdown */}
              {dropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 z-50 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  {locations.length === 0 ? (
                    <div className="p-3 text-xs text-slate-500 text-center">
                      No matching verified location found.
                    </div>
                  ) : (
                    locations.map((loc) => (
                      <button
                        data-testid={`finder-location-${loc.id}`}
                        key={loc.id}
                        onClick={() => {
                          setSelectedLocation(loc);
                          setSearchQuery(`${loc.name}, ${loc.countryName}`);
                          setDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-indigo-50"
                      >
                        <div>
                          <span className="font-bold text-slate-900">{loc.name}</span>
                          <span className="text-slate-500 ml-1.5">({loc.countryName})</span>
                          {loc.aliases?.length > 0 && (
                            <span className="text-[10px] text-slate-400 ml-1.5">
                              Alias: {loc.aliases.join(', ')}
                            </span>
                          )}
                        </div>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                          {loc.bucket}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Launch Action */}
            <div className="md:col-span-2 flex items-end">
              <button
                onClick={handleInspectPage}
                id="view-service-location-page-btn"
                data-testid="finder-view-page"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 px-4 text-sm font-bold text-white shadow-xs transition-all"
              >
                <span>View Page</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

          </div>

          {/* Active Selection Information Pill */}
          {selectedLocation && currentService && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700 font-medium">
                  <span className="font-bold text-slate-900">{currentService.title}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-indigo-700 font-semibold">{selectedLocation.name}, {selectedLocation.countryName}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 font-mono text-[11px]">{selectedLocation.timezone}</span>
                </div>
                <p data-testid="finder-canonical-path" className="break-all text-xs text-slate-500 font-mono">
                  Canonical URL: {selectedLocation.canonicalPath}{currentService.slug}/
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  data-testid="finder-quick-enquiry"
                  onClick={() => onOpenEnquiry(currentService.id, selectedLocation.id)}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors"
                >
                  Quick Project Enquiry
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
};
