export enum MixpanelEvent {
    // Événements de navigation
    PAGE_VIEW = 'Page View',
    
    // Événements de redirection
    REDIRECT_TO_APP = 'Redirect To App',
    
    // Événements d'interaction utilisateur
    BUTTON_CLICK = 'Button Clicked',
    LINK_CLICK = 'Link Clicked',
    
    // Événements spécifiques
    START_FREE_CLICK = 'Start Free Button Clicked',
    DEMO_VIEW = 'Demo Video Viewed',
    SIGNUP_CLICK = 'Signup Button Clicked',
    LOGIN_CLICK = 'Login Button Clicked',
    GO_TO_APP_CLICK = 'Go to App Button Clicked',

    CREATED_ACCOUNT = 'Created account',
    FINISHED_ONBOARDING = 'Finished onboarding',
    
    // Événements de formulaire
    FORM_SUBMIT = 'Form Submitted',
    FORM_ERROR = 'Form Error',
    
    // Événements de parcours utilisateur
    CROSS_DOMAIN_CONTINUATION = 'Cross Domain Continuation',
  }