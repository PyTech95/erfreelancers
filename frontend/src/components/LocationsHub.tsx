import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { Globe, MapPin, ChevronRight, Search, Building2, Layers, Sparkles, Phone, MessageSquare } from 'lucide-react';
import { LocationEntity, ServiceDefinition } from '../types';

interface LocationsHubProps {
  services: ServiceDefinition[];
  onSelectServiceLocation: (service: ServiceDefinition, location: LocationEntity) => void;
}

export const LocationsHub: React.FC<LocationsHubProps> = ({
  services,
  onSelectServiceLocation
}) => {
  const [query, setQuery] = useState('');
  const [selectedBucket, setSelectedBucket] = useState<'all' | 'india' | 'uae' | 'international'>('all');
  const [locations, setLocations] = useState<LocationEntity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, [query, selectedBucket]);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      let url = `/api/locations?limit=36&q=${encodeURIComponent(query)}`;
      if (selectedBucket === 'india') url += '&country=India';
      if (selectedBucket === 'uae') url += '&country=United Arab Emirates';
      const res = await apiFetch(url);
      const data = await res.json();
      setLocations(data.locations || []);
    } catch (err) {
      console.error('Failed to load locations:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="locations-hub" className="py-20 bg-slate-50/70 border-b border-slate-200 text-left">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-semibold text-indigo-700 mb-3 shadow-xs">
              <MapPin className="h-3.5 w-3.5 text-indigo-600" />
              <span>3,600+ Verified Geographic Hubs Near You</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
              Best Freelancer Services Near Me
            </h2>
            <p className="text-base text-slate-600 mt-2 max-w-2xl">
              Connect with top-rated freelance website designers and developers in Delhi, Laxmi Nagar, Noida, Gurugram, or your local city with 100% IP ownership.
            </p>
          </div>

          {/* Bucket filter pills */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-white border border-slate-200 p-1.5 text-xs font-semibold self-start md:self-auto shadow-xs">
            <button
              onClick={() => setSelectedBucket('all')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                selectedBucket === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              All Regions (3,600)
            </button>
            <button
              onClick={() => setSelectedBucket('india')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                selectedBucket === 'india' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              India (2,400)
            </button>
            <button
              onClick={() => setSelectedBucket('uae')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                selectedBucket === 'uae' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              UAE & Middle East (400)
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city, district, or neighborhood (e.g. 'Noida', 'Gurugram', 'South Delhi')..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 shadow-xs"
          />
        </div>

        {/* Locations Grid */}
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Loading verified locations...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="group rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase">
                      {loc.type}
                    </span>
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
                      {loc.timezone}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 font-display group-hover:text-indigo-600 transition-colors">
                    {loc.name}
                  </h3>
                  <p className="text-xs text-slate-500">{loc.countryName}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono font-medium">
                    14 Services Ready
                  </span>

                  <button
                    onClick={() => onSelectServiceLocation(services[0], loc)}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <span>View Page</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
