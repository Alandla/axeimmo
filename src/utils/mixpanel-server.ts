import Mixpanel from 'mixpanel';

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

if (!MIXPANEL_TOKEN) {
  throw new Error('MIXPANEL_TOKEN is required');
}

const mixpanel = Mixpanel.init(MIXPANEL_TOKEN, {
  debug: process.env.NODE_ENV !== 'production',
});

export const track = (eventName: string, properties: Record<string, any> = {}) => {
  mixpanel.track(eventName, properties);
};

export const identify = (userId: string, traits: Record<string, any> = {}) => {
  mixpanel.people.set(userId, traits);
};

export default mixpanel; 