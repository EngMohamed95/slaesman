import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_LEADS, INITIAL_TASKS } from '../mockData';
import { useApp } from './AppContext';

const CRMContext = createContext();

const INITIAL_CAMPAIGNS = [
  {
    id: 'c1',
    platform: 'Facebook, Instagram',
    goal: 'WhatsApp Leads',
    budget: 500,
    city: 'Riyadh',
    age: '25-45',
    interests: 'Real estate investment, luxury villas',
    duration: 15,
    language: 'ar',
    offerDetails: '10% down payment, 7-year installments in Yasmin Project',
    status: 'Active & Delivering',
    statusAr: 'نشطة وتجلب عملاء',
    date: '2026-06-01',
    notes: 'Please target high income areas.'
  },
  {
    id: 'c2',
    platform: 'Snapchat',
    goal: 'Calls',
    budget: 300,
    city: 'Jeddah',
    age: '21-35',
    interests: 'First-time home buyers, apartments',
    duration: 10,
    language: 'ar',
    offerDetails: 'Pre-launch prices starting from 499,000 SAR',
    status: 'Pending Review',
    statusAr: 'قيد المراجعة والتدقيق',
    date: '2026-06-03',
    notes: 'Target Saudi young families.'
  }
];

export const CRMProvider = ({ children }) => {
  const { user } = useApp();
  
  // Use a default prefix key if not logged in
  const getEmailPrefix = () => user?.email || 'default';

  // Helper to load leads with migration fallback
  const loadLeadsForUser = (userEmail) => {
    const userKey = `salesmate_leads_${userEmail}`;
    const saved = localStorage.getItem(userKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.length > 0) return parsed;
    }
    
    // Migration fallback: check the legacy shared key
    const oldSaved = localStorage.getItem('salesmate_leads');
    if (oldSaved) {
      const parsedOld = JSON.parse(oldSaved);
      if (parsedOld && parsedOld.length > 0) {
        localStorage.setItem(userKey, oldSaved);
        return parsedOld;
      }
    }
    return userEmail === 'default' ? INITIAL_LEADS : [];
  };

  const loadTasksForUser = (userEmail) => {
    const userKey = `salesmate_tasks_${userEmail}`;
    const saved = localStorage.getItem(userKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.length > 0) return parsed;
    }
    
    const oldSaved = localStorage.getItem('salesmate_tasks');
    if (oldSaved) {
      const parsedOld = JSON.parse(oldSaved);
      if (parsedOld && parsedOld.length > 0) {
        localStorage.setItem(userKey, oldSaved);
        return parsedOld;
      }
    }
    return userEmail === 'default' ? INITIAL_TASKS : [];
  };

  const loadCampaignsForUser = (userEmail) => {
    const userKey = `salesmate_campaign_requests_${userEmail}`;
    const saved = localStorage.getItem(userKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.length > 0) return parsed;
    }
    
    const oldSaved = localStorage.getItem('salesmate_campaign_requests');
    if (oldSaved) {
      const parsedOld = JSON.parse(oldSaved);
      if (parsedOld && parsedOld.length > 0) {
        localStorage.setItem(userKey, oldSaved);
        return parsedOld;
      }
    }
    return userEmail === 'default' ? INITIAL_CAMPAIGNS : [];
  };

  const [leads, setLeads] = useState(() => loadLeadsForUser(getEmailPrefix()));
  const [tasks, setTasks] = useState(() => loadTasksForUser(getEmailPrefix()));
  const [campaignRequests, setCampaignRequests] = useState(() => loadCampaignsForUser(getEmailPrefix()));

  const [loadedEmail, setLoadedEmail] = useState(getEmailPrefix());

  // Reload data when active user changes
  useEffect(() => {
    const userEmail = getEmailPrefix();
    setLeads(loadLeadsForUser(userEmail));
    setTasks(loadTasksForUser(userEmail));
    setCampaignRequests(loadCampaignsForUser(userEmail));
    setLoadedEmail(userEmail);
  }, [user]);

  // Save changes ONLY if state matches the active user key
  useEffect(() => {
    const userEmail = getEmailPrefix();
    if (loadedEmail === userEmail) {
      localStorage.setItem(`salesmate_leads_${userEmail}`, JSON.stringify(leads));
    }
  }, [leads, user, loadedEmail]);

  useEffect(() => {
    const userEmail = getEmailPrefix();
    if (loadedEmail === userEmail) {
      localStorage.setItem(`salesmate_tasks_${userEmail}`, JSON.stringify(tasks));
    }
  }, [tasks, user, loadedEmail]);

  useEffect(() => {
    const userEmail = getEmailPrefix();
    if (loadedEmail === userEmail) {
      localStorage.setItem(`salesmate_campaign_requests_${userEmail}`, JSON.stringify(campaignRequests));
    }
  }, [campaignRequests, user, loadedEmail]);

  // Lead Actions
  const addLead = (lead) => {
    const newLead = {
      id: Date.now().toString(),
      consent: { whatsapp: true, calls: true, marketing: true },
      notes: '',
      notesAr: '',
      ...lead,
    };
    setLeads((prev) => [newLead, ...prev]);
    return newLead;
  };

  const updateLead = (id, updatedFields) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updatedFields } : l))
    );
  };

  const deleteLead = (id) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setTasks((prev) => prev.filter((t) => t.leadId !== id));
  };

  // Task Actions
  const addTask = (task) => {
    const now = new Date().toISOString();
    const newTask = {
      id: Date.now().toString(),
      completed: false,
      status: 'todo',
      createdAt: now,
      updatedAt: now,
      ...task
    };
    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  };

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const completed = !t.completed;
        return {
          ...t,
          completed,
          status: completed ? 'done' : 'todo',
          completedAt: completed ? new Date().toISOString() : null,
          updatedAt: new Date().toISOString()
        };
      })
    );
  };

  const updateTask = (id, updatedFields) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const next = { ...task, ...updatedFields, updatedAt: new Date().toISOString() };
        if (updatedFields.status) {
          next.completed = updatedFields.status === 'done';
          next.completedAt = next.completed
            ? (task.completedAt || new Date().toISOString())
            : null;
        }
        return next;
      })
    );
  };

  const addFollowUpSequence = ({ leadId, title, titleAr, priority, type, notes, startAt }) => {
    const baseTime = new Date(startAt || Date.now()).getTime();
    const schedule = [
      { key: '48h', hours: 48, labelAr: 'متابعة بعد 48 ساعة', labelEn: '48-hour follow-up' },
      { key: '4d', hours: 96, labelAr: 'متابعة بعد 4 أيام', labelEn: '4-day follow-up' },
      { key: '7d', hours: 168, labelAr: 'متابعة بعد أسبوع', labelEn: '7-day follow-up' }
    ];
    const sequenceId = `seq-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const sequenceTasks = schedule.map((step, index) => {
      const dueAt = new Date(baseTime + step.hours * 60 * 60 * 1000).toISOString();
      return {
        id: `${Date.now()}-${index}`,
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
        updatedAt: createdAt
      };
    });
    setTasks((prev) => [...sequenceTasks, ...prev]);
    return sequenceTasks;
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Campaign Request Actions
  const addCampaignRequest = (req) => {
    const newReq = {
      id: Date.now().toString(),
      status: 'Pending Review',
      statusAr: 'قيد المراجعة والتدقيق',
      date: new Date().toISOString().split('T')[0],
      ...req
    };
    setCampaignRequests((prev) => [newReq, ...prev]);
  };

  const updateCampaignStatus = (id, newStatus, newStatusAr) => {
    setCampaignRequests((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: newStatus, statusAr: newStatusAr || newStatus }
          : c
      )
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
      updateCampaignStatus
    }}>
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => useContext(CRMContext);
