/**
 * Postgres rows ↔ the objects the pages already consume.
 *
 * The whole point of this file is that it is the ONLY place snake_case appears.
 * Ten pages read `lead.nextFollowUp` and `task.dueDate`; none of them should
 * learn that the database calls those `next_follow_up` and `due_date`.
 */

/** '' is a valid string but not a valid date/uuid/number — Postgres rejects it. */
const nullIfBlank = (v) => (v === '' || v === undefined ? null : v);

const numOrNull = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ids are generated client-side so addLead() can stay synchronous. */
export const newId = () => crypto.randomUUID();

/** lead_id is a real foreign key now; a stale legacy id must become null. */
const uuidOrNull = (v) => (typeof v === 'string' && UUID_RE.test(v) ? v : null);

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------
export const leadFromRow = (row) => ({
  id: row.id,
  name: row.name || '',
  nameAr: row.name_ar || '',
  phone: row.phone || '',
  email: row.email || '',
  source: row.source || '',
  sourceAr: row.source_ar || '',
  service: row.service || '',
  serviceAr: row.service_ar || '',
  budget: row.budget === null ? '' : Number(row.budget),
  expectedValue: row.expected_value === null ? '' : Number(row.expected_value),
  status: row.status || 'New',
  statusAr: row.status_ar || '',
  interestLevel: row.interest_level || '',
  interestLevelAr: row.interest_level_ar || '',
  lastContact: row.last_contact || '',
  nextFollowUp: row.next_follow_up || '',
  notes: row.notes || '',
  notesAr: row.notes_ar || '',
  consent: row.consent || { whatsapp: true, calls: true, marketing: true },
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const leadToRow = (lead, { orgId, ownerId }) => ({
  id: lead.id,
  org_id: orgId,
  owner_id: ownerId,
  name: lead.name || 'Unnamed lead',
  name_ar: nullIfBlank(lead.nameAr),
  phone: nullIfBlank(lead.phone),
  email: nullIfBlank(lead.email),
  source: nullIfBlank(lead.source),
  source_ar: nullIfBlank(lead.sourceAr),
  service: nullIfBlank(lead.service),
  service_ar: nullIfBlank(lead.serviceAr),
  budget: numOrNull(lead.budget),
  expected_value: numOrNull(lead.expectedValue),
  status: lead.status || 'New',
  status_ar: nullIfBlank(lead.statusAr),
  interest_level: nullIfBlank(lead.interestLevel),
  interest_level_ar: nullIfBlank(lead.interestLevelAr),
  last_contact: nullIfBlank(lead.lastContact),
  next_follow_up: nullIfBlank(lead.nextFollowUp),
  notes: nullIfBlank(lead.notes),
  notes_ar: nullIfBlank(lead.notesAr),
  consent: lead.consent || { whatsapp: true, calls: true, marketing: true },
});

/** Only the fields actually being changed, so a PATCH never clobbers siblings. */
export const leadPatchToRow = (patch) => {
  const map = {
    name: 'name', nameAr: 'name_ar', phone: 'phone', email: 'email',
    source: 'source', sourceAr: 'source_ar', service: 'service', serviceAr: 'service_ar',
    status: 'status', statusAr: 'status_ar',
    interestLevel: 'interest_level', interestLevelAr: 'interest_level_ar',
    lastContact: 'last_contact', nextFollowUp: 'next_follow_up',
    notes: 'notes', notesAr: 'notes_ar', consent: 'consent',
  };
  const numeric = { budget: 'budget', expectedValue: 'expected_value' };
  const dates = new Set(['lastContact', 'nextFollowUp']);

  const row = {};
  for (const [key, value] of Object.entries(patch)) {
    if (key in numeric) row[numeric[key]] = numOrNull(value);
    else if (key in map) row[map[key]] = dates.has(key) ? nullIfBlank(value) : (value ?? null);
  }
  return row;
};

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------
export const taskFromRow = (row) => ({
  id: row.id,
  leadId: row.lead_id || '',
  title: row.title || '',
  titleAr: row.title_ar || '',
  notes: row.notes || '',
  type: row.type || '',
  priority: row.priority || 'Medium',
  status: row.status || 'todo',
  completed: Boolean(row.completed),
  dueAt: row.due_at || '',
  dueDate: row.due_date || '',
  completedAt: row.completed_at || null,
  sequenceId: row.sequence_id || null,
  sequenceStep: row.sequence_step || null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const taskToRow = (task, { orgId, ownerId }) => ({
  id: task.id,
  org_id: orgId,
  owner_id: ownerId,
  lead_id: uuidOrNull(task.leadId),
  title: task.title || 'Follow-up',
  title_ar: nullIfBlank(task.titleAr),
  notes: nullIfBlank(task.notes),
  type: nullIfBlank(task.type),
  priority: task.priority || 'Medium',
  status: task.status || 'todo',
  completed: Boolean(task.completed),
  due_at: nullIfBlank(task.dueAt),
  due_date: nullIfBlank(task.dueDate),
  completed_at: nullIfBlank(task.completedAt),
  sequence_id: uuidOrNull(task.sequenceId),
  sequence_step: nullIfBlank(task.sequenceStep),
});

export const taskPatchToRow = (patch) => {
  const map = {
    title: 'title', titleAr: 'title_ar', notes: 'notes', type: 'type',
    priority: 'priority', status: 'status', completed: 'completed',
    dueAt: 'due_at', dueDate: 'due_date', completedAt: 'completed_at',
    sequenceStep: 'sequence_step',
  };
  const blankable = new Set(['dueAt', 'dueDate', 'completedAt']);

  const row = {};
  for (const [key, value] of Object.entries(patch)) {
    if (key === 'leadId') row.lead_id = uuidOrNull(value);
    else if (key === 'sequenceId') row.sequence_id = uuidOrNull(value);
    else if (key in map) row[map[key]] = blankable.has(key) ? nullIfBlank(value) : (value ?? null);
  }
  return row;
};

// ---------------------------------------------------------------------------
// Campaign requests
// ---------------------------------------------------------------------------
export const campaignFromRow = (row) => ({
  id: row.id,
  platform: row.platform || '',
  goal: row.goal || '',
  budget: row.budget === null ? '' : Number(row.budget),
  city: row.city || '',
  age: row.age || '',
  interests: row.interests || '',
  duration: row.duration === null ? '' : Number(row.duration),
  language: row.language || 'ar',
  offerDetails: row.offer_details || '',
  notes: row.notes || '',
  status: row.status || 'Pending Review',
  statusAr: row.status_ar || 'قيد المراجعة والتدقيق',
  date: row.request_date || '',
  createdAt: row.created_at,
});

export const campaignToRow = (req, { orgId, ownerId }) => ({
  id: req.id,
  org_id: orgId,
  owner_id: ownerId,
  platform: nullIfBlank(req.platform),
  goal: nullIfBlank(req.goal),
  budget: numOrNull(req.budget),
  city: nullIfBlank(req.city),
  age: nullIfBlank(req.age),
  interests: nullIfBlank(req.interests),
  duration: numOrNull(req.duration),
  language: req.language || 'ar',
  offer_details: nullIfBlank(req.offerDetails),
  notes: nullIfBlank(req.notes),
  // `status` is deliberately not sent: the insert policy lets a customer create
  // a request, but only platform staff may move it off "Pending Review".
  request_date: nullIfBlank(req.date),
});
