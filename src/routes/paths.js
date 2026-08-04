// Page ids are the historical `setPage()` vocabulary that ~40 call sites still
// use. Paths deliberately match them one-for-one so every previously bookmarked
// #/<id> URL keeps resolving after the move to react-router.
export const PAGE_PATHS = {
  landing: '/landing',
  login: '/login',
  register: '/register',
  onboarding: '/onboarding',
  dashboard: '/dashboard',
  crm: '/crm',
  // Creation flows are pages, not modals. They nest under their module's path
  // so the URL says where you are and the form survives a refresh or a shared
  // link — neither of which a modal could do.
  addLead: '/crm/new',
  tasks: '/tasks',
  addTask: '/tasks/new',
  aiAssistant: '/aiAssistant',
  whatsapp: '/whatsapp',
  socialCreator: '/socialCreator',
  campaigns: '/campaigns',
  reports: '/reports',
  subscriptions: '/subscriptions',
  settings: '/settings',
  admin: '/admin',
  // `leadDetails` is parameterised — setPage() resolves it to /lead/:id.
};
