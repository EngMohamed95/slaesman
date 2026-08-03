import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from './AppContext';
import {
  newId,
  leadFromRow, leadToRow, leadPatchToRow,
  taskFromRow, taskToRow, taskPatchToRow,
  campaignFromRow, campaignToRow,
} from '../lib/mappers';

const CRMContext = createContext();

/**
 * Leads, tasks and campaign requests now live in Postgres.
 *
 * The public surface is unchanged on purpose — `addLead` still returns the new
 * object synchronously because CRMPage reads it on the next line. Writes are
 * optimistic: state updates immediately, the network call follows, and a
 * failure rolls the state back and reports through `syncError`. Silently
 * dropping a write the user watched succeed is worse than an error banner.
 */
export const CRMProvider = ({ children }) => {
  const { user, orgId, orgLoading } = useApp();

  const [leads, setLeads] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [campaignRequests, setCampaignRequests] = useState([]);

  const [dataLoading, setDataLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [syncError, setSyncError] = useState(null);

  const ownerRef = useRef({ orgId: null, ownerId: null });
  ownerRef.current = { orgId, ownerId: user?.id || null };

  // ---------------------------------------------------------------------------
  // Read path
  // ---------------------------------------------------------------------------
  const load = useCallback(async (signal) => {
    if (!supabase || !user?.id || !orgId) {
      setLeads([]);
      setTasks([]);
      setCampaignRequests([]);
      setDataLoading(orgLoading);
      return;
    }

    setDataLoading(true);
    setLoadError(null);

    const [leadRes, taskRes, campaignRes] = await Promise.all([
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('campaign_requests').select('*').order('created_at', { ascending: false }),
    ]);

    if (signal?.aborted) return;

    const failure = leadRes.error || taskRes.error || campaignRes.error;
    if (failure) {
      console.error('[crm] load failed:', failure.message);
      setLoadError(failure.message);
      setDataLoading(false);
      return;
    }

    setLeads((leadRes.data || []).map(leadFromRow));
    setTasks((taskRes.data || []).map(taskFromRow));
    setCampaignRequests((campaignRes.data || []).map(campaignFromRow));
    setDataLoading(false);
  }, [user?.id, orgId, orgLoading]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const refresh = useCallback(() => load(), [load]);

  // ---------------------------------------------------------------------------
  // Write path. Every mutation: update state, then persist, then roll back on
  // failure. `rollback` captures the pre-mutation array, not a diff, so an
  // interleaved failure can never resurrect a half-applied change.
  // ---------------------------------------------------------------------------
  const persist = (run, rollback, label) => {
    Promise.resolve()
      .then(run)
      .then(({ error }) => {
        if (!error) return;
        console.error(`[crm] ${label} failed:`, error.message);
        rollback();
        setSyncError({ label, message: error.message });
      })
      .catch((err) => {
        console.error(`[crm] ${label} threw:`, err?.message || err);
        rollback();
        setSyncError({ label, message: err?.message || 'network_error' });
      });
  };

  const scope = () => ({ orgId: ownerRef.current.orgId, ownerId: ownerRef.current.ownerId });

  const writable = () => Boolean(supabase && ownerRef.current.orgId && ownerRef.current.ownerId);

  // ---- Leads ----------------------------------------------------------------
  const addLead = (lead) => {
    const newLead = {
      id: newId(),
      consent: { whatsapp: true, calls: true, marketing: true },
      notes: '',
      notesAr: '',
      ...lead,
    };

    if (!writable()) {
      setSyncError({ label: 'addLead', message: 'no_organization' });
      return newLead;
    }

    const previous = leads;
    setLeads((prev) => [newLead, ...prev]);
    persist(
      () => supabase.from('leads').insert(leadToRow(newLead, scope())),
      () => setLeads(previous),
      'addLead'
    );
    return newLead;
  };

  const updateLead = (id, updatedFields) => {
    const previous = leads;
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updatedFields } : l)));
    if (!writable()) return;
    persist(
      () => supabase.from('leads').update(leadPatchToRow(updatedFields)).eq('id', id),
      () => setLeads(previous),
      'updateLead'
    );
  };

  const deleteLead = (id) => {
    const previousLeads = leads;
    const previousTasks = tasks;
    setLeads((prev) => prev.filter((l) => l.id !== id));
    // Postgres cascades tasks on lead delete; mirror it locally so the UI
    // matches what the next reload will show.
    setTasks((prev) => prev.filter((t) => t.leadId !== id));
    if (!writable()) return;
    persist(
      () => supabase.from('leads').delete().eq('id', id),
      () => { setLeads(previousLeads); setTasks(previousTasks); },
      'deleteLead'
    );
  };

  // ---- Tasks ----------------------------------------------------------------
  const addTask = (task) => {
    const now = new Date().toISOString();
    const newTask = {
      id: newId(),
      completed: false,
      status: 'todo',
      createdAt: now,
      updatedAt: now,
      ...task,
    };

    if (!writable()) {
      setSyncError({ label: 'addTask', message: 'no_organization' });
      return newTask;
    }

    const previous = tasks;
    setTasks((prev) => [newTask, ...prev]);
    persist(
      () => supabase.from('tasks').insert(taskToRow(newTask, scope())),
      () => setTasks(previous),
      'addTask'
    );
    return newTask;
  };

  const toggleTask = (id) => {
    const current = tasks.find((t) => t.id === id);
    if (!current) return;
    const completed = !current.completed;
    const patch = {
      completed,
      status: completed ? 'done' : 'todo',
      completedAt: completed ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    };

    const previous = tasks;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    if (!writable()) return;
    persist(
      () => supabase.from('tasks').update(taskPatchToRow(patch)).eq('id', id),
      () => setTasks(previous),
      'toggleTask'
    );
  };

  const updateTask = (id, updatedFields) => {
    const current = tasks.find((t) => t.id === id);
    if (!current) return;

    const patch = { ...updatedFields, updatedAt: new Date().toISOString() };
    if (updatedFields.status) {
      patch.completed = updatedFields.status === 'done';
      patch.completedAt = patch.completed
        ? (current.completedAt || new Date().toISOString())
        : null;
    }

    const previous = tasks;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    if (!writable()) return;
    persist(
      () => supabase.from('tasks').update(taskPatchToRow(patch)).eq('id', id),
      () => setTasks(previous),
      'updateTask'
    );
  };

  const addFollowUpSequence = ({ leadId, title, titleAr, priority, type, notes, startAt }) => {
    const baseTime = new Date(startAt || Date.now()).getTime();
    const schedule = [
      { key: '48h', hours: 48, labelAr: 'متابعة بعد 48 ساعة', labelEn: '48-hour follow-up' },
      { key: '4d', hours: 96, labelAr: 'متابعة بعد 4 أيام', labelEn: '4-day follow-up' },
      { key: '7d', hours: 168, labelAr: 'متابعة بعد أسبوع', labelEn: '7-day follow-up' },
    ];
    // sequence_id is a uuid column now; the old `seq-${Date.now()}` string
    // would be rejected by Postgres.
    const sequenceId = newId();
    const createdAt = new Date().toISOString();

    const sequenceTasks = schedule.map((step) => {
      const dueAt = new Date(baseTime + step.hours * 60 * 60 * 1000).toISOString();
      return {
        id: newId(),
        leadId,
        title: `${title || 'Client follow-up'} — ${step.labelEn}`,
        titleAr: `${titleAr || title || 'متابعة العميل'} — ${step.labelAr}`,
        priority,
        type,
        notes,
        dueAt,
        dueDate: dueAt.split('T')[0],
        status: 'todo',
        completed: false,
        sequenceId,
        sequenceStep: step.key,
        createdAt,
        updatedAt: createdAt,
      };
    });

    if (!writable()) {
      setSyncError({ label: 'addFollowUpSequence', message: 'no_organization' });
      return sequenceTasks;
    }

    const previous = tasks;
    setTasks((prev) => [...sequenceTasks, ...prev]);
    persist(
      () => supabase.from('tasks').insert(sequenceTasks.map((t) => taskToRow(t, scope()))),
      () => setTasks(previous),
      'addFollowUpSequence'
    );
    return sequenceTasks;
  };

  const deleteTask = (id) => {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (!writable()) return;
    persist(
      () => supabase.from('tasks').delete().eq('id', id),
      () => setTasks(previous),
      'deleteTask'
    );
  };

  // ---- Campaign requests ----------------------------------------------------
  const addCampaignRequest = (req) => {
    const newReq = {
      id: newId(),
      status: 'Pending Review',
      statusAr: 'قيد المراجعة والتدقيق',
      date: new Date().toISOString().split('T')[0],
      ...req,
    };

    if (!writable()) {
      setSyncError({ label: 'addCampaignRequest', message: 'no_organization' });
      return newReq;
    }

    const previous = campaignRequests;
    setCampaignRequests((prev) => [newReq, ...prev]);
    persist(
      () => supabase.from('campaign_requests').insert(campaignToRow(newReq, scope())),
      () => setCampaignRequests(previous),
      'addCampaignRequest'
    );
    return newReq;
  };

  /**
   * Platform staff only. The RLS update policy requires an admin claim, so for
   * everyone else this silently matches zero rows — which is the point: a
   * customer approving their own campaign was the original defect.
   */
  const updateCampaignStatus = (id, newStatus, newStatusAr) => {
    const previous = campaignRequests;
    setCampaignRequests((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus, statusAr: newStatusAr || newStatus } : c))
    );
    if (!writable()) return;
    persist(
      () => supabase
        .from('campaign_requests')
        .update({ status: newStatus, status_ar: newStatusAr || newStatus })
        .eq('id', id)
        .select('id'),
      () => setCampaignRequests(previous),
      'updateCampaignStatus'
    );
  };

  return (
    <CRMContext.Provider value={{
      leads,
      addLead,
      updateLead,
      deleteLead,
      tasks,
      addTask,
      addFollowUpSequence,
      updateTask,
      toggleTask,
      deleteTask,
      campaignRequests,
      addCampaignRequest,
      updateCampaignStatus,
      // Loading / error surface for the boundary and banners.
      dataLoading: dataLoading || orgLoading,
      loadError,
      syncError,
      dismissSyncError: () => setSyncError(null),
      refresh,
    }}>
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => useContext(CRMContext);
