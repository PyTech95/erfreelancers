import React from 'react';
import PublicPage from '../pages/PublicPage';
import { ServiceDefinition, LocationEntity } from '../types';
import { publicPath } from '../publicRoutes';

interface ServiceLocationDetailProps {
  service: ServiceDefinition;
  location: LocationEntity;
  onBack: () => void;
  onOpenEnquiry: (serviceId: string, locationId: string, freelancerId?: string) => void;
}

/** Use the same approved content and metadata as the server-delivered document. */
export const ServiceLocationDetail: React.FC<ServiceLocationDetailProps> = ({ service, location, onOpenEnquiry }) => (
  <PublicPage
    path={`${publicPath(location.canonicalPath).replace(/\/?$/, '/')}${service.slug}/`}
    onOpenEnquiry={(serviceId, locationId, freelancerId) => onOpenEnquiry(serviceId || service.id, locationId || location.id, freelancerId)}
  />
);
