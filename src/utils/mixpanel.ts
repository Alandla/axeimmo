'use client';

import mixpanel from 'mixpanel-browser';
import { MixpanelEvent } from '../types/events';

// Remplacez par votre token Mixpanel
const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || 'your-token-here';

// Initialiser Mixpanel avec conservation de l'ID entre sous-domaines
const initMixpanel = () => {
  mixpanel.init(MIXPANEL_TOKEN, { 
    debug: process.env.NODE_ENV !== 'production',
    track_pageview: false,
    persistence: 'localStorage',
    cross_subdomain_cookie: true,
    ignore_dnt: true,
  });
};

// Appeler l'initialisation que côté client
if (typeof window !== 'undefined') {
  initMixpanel();
}

// Suivi de page
export const trackPageView = (pageName?: string) => {
  const page = pageName || (typeof window !== 'undefined' ? window.location.pathname : '');
  mixpanel.track(MixpanelEvent.PAGE_VIEW, { 
    page,
    site: 'app',
    url: typeof window !== 'undefined' ? window.location.href : '',
    referrer: typeof window !== 'undefined' ? document.referrer : '',
    cross_subdomain_cookie: true,
    cookie_domain: 'hoox.video',
    ignore_dnt: true,
  });
};

// Identifie l'utilisateur
export const identify = (userId: string, traits?: Record<string, any>) => {
  mixpanel.identify(userId);
  if (traits) {
    mixpanel.people.set(traits);
  }
};

export const setMixpanelUserProperty = (property: string, value: any) => {
  mixpanel.people.set(property, value);
};

export const setMixpanelUserProperties = (properties: Record<string, any>) => {
  mixpanel.people.set(properties);
};

// Réinitialise l'utilisateur (déconnexion)
export const reset = () => {
  mixpanel.reset();
};

// Suit un événement générique
export const track = (eventName: string, properties?: Record<string, any>) => {
  mixpanel.track(eventName, properties);
};

// Récupère le deviceId de Mixpanel
export const getDeviceId = () => {
  return mixpanel.get_distinct_id();
};

// Exporte l'instance de mixpanel (au cas où on ait besoin d'accès direct)
export default mixpanel; 