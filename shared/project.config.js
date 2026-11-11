// =============================================================
// YOUR TEAM AND PROJECT: fill this in first!
// The web page AND the AI agent both read this file, so the app
// introduces your team and the agent knows what problem it serves.
// Anything still starting with "TODO" shows up highlighted on the page.
// =============================================================

export const project = {
  teamName: 'TeamSOS',
  appName: 'TBD',
  tagline: 'Find help nearby, in plain language.',

  // One or two sentences. Who is hurting, and how?
  problemStatement:
    "Our app helps society's most vulnerable groups (who) to stay safe while traveling alone (do what) by using AI to assign a volunteer to act as a digital supervisor.",

  // One specific person. Give them a name, an age, and a situation.
  targetUser: 'Alicia, solo-traveler, 23-29, vacationing, exploring the city by herself.',

  community: 'New York, NY',
  theme: 'Emergency Response',

  // How you will know it works. Make it measurable.
  successMeasure:
    "The trusted contact/volunteer contact has received an alert with the user's live location within seconds of an SOS trigger - manual or AI flagged, and knows the user may need help.",

  teamMembers: [
    { name: 'TODO', role: 'Product owner (writes tickets)' },
    { name: 'TODO', role: 'Front end (React)' },
    { name: 'TODO', role: 'Back end (API + database)' },
    { name: 'TODO', role: 'AI agent and skills' },
  ],

  // The personality of your AI agent. Used in its system prompt.
  agent: {
    name: 'Compass',
    voice: 'warm, encouraging, and plain-spoken, like a helpful neighbor',
    readingLevel: '6th grade',
  },
};

// True if a value still needs to be filled in.
export const isTodo = (value) => typeof value === 'string' && value.trim().startsWith('TODO');
