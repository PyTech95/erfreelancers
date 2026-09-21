import React, { useState } from 'react';
import { Layers, ArrowRight, CheckCircle2, Clock, MapPin, Sparkles } from 'lucide-react';
import { ServiceDefinition } from '../types';
import { serviceImage } from '../constants/serviceImages';

interface ServicesGridProps {
  services: ServiceDefinition[];
  onSelectService: (service: ServiceDefinition) => void;
  onOpenEnquiry: (serviceId: string) => void;
}

export const ServicesGrid: React.FC<ServicesGridProps> = ({
  services,
  onSelectService,
  onOpenEnquiry
}) => {
  const [activeCategory, setActiveCategory] = useState<'All' | 'Websites' | 'Apps & Software' | 'Growth & Automation'>('All');

  const filteredServices = activeCategory === 'All'
    ? services
    : services.filter(s => s.category === activeCategory);

  return (
    <section id="services" className="py-20 border-b border-slate-200 bg-slate-50/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-left">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-semibold text-indigo-700 mb-3 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>14 Specialized Digital Services Near You</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
              Hire by Specialization
            </h2>
            <p className="text-base text-slate-600 mt-2 max-w-2xl">
              Choose the exact capability you need. Every service features vetted senior developers, transparent deliverables, and local timezone coordination.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-white border border-slate-200 p-1.5 text-xs font-semibold self-start md:self-auto shadow-xs">
            {(['All', 'Websites', 'Apps & Software', 'Growth & Automation'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-lg px-3.5 py-2 transition-all ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Services Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              data-testid={`service-card-${service.id}`}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:border-indigo-500/80 hover:shadow-xl hover:-translate-y-0.5"
            >
              {/* Service Image */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                <img
                  src={serviceImage(service.id)}
                  alt={`${service.title} illustration`}
                  loading="lazy"
                  data-testid={`service-image-${service.id}`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-lg bg-white/90 backdrop-blur border border-indigo-100 px-2.5 py-1 text-[11px] font-mono font-bold text-indigo-700 shadow-xs">
                  {service.id}
                </span>
                <span className="absolute right-3 top-3 rounded-lg bg-slate-900/80 backdrop-blur px-2.5 py-1 text-[10px] font-semibold text-white flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{service.typicalTimelineDays}</span>
                </span>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 font-display group-hover:text-indigo-600 transition-colors">
                  {service.title}
                </h3>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">
                  {service.scopeBoundary}
                </p>

                {/* Key Deliverables */}
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Deliverables Include:
                  </p>
                  {service.deliverables.slice(0, 3).map((d, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{d}</span>
                    </div>
                  ))}
                </div>

                {/* Tech Chips */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {service.techOptions.slice(0, 3).map((tech, i) => (
                    <span key={i} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 px-6 pb-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => onSelectService(service)}
                  data-testid={`service-view-${service.id}`}
                  className="text-xs font-semibold text-indigo-600 group-hover:text-indigo-700 flex items-center gap-1 transition-colors"
                >
                  <span>View Details</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() => onOpenEnquiry(service.id)}
                  data-testid={`service-hire-${service.id}`}
                  className="rounded-xl bg-slate-900 hover:bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors shadow-xs"
                >
                  Hire Specialist
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
