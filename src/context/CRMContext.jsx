import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_LEADS, INITIAL_TASKS } from '../mockData';

const CRMContext = createContext();

export const CRMProvider = ({ children }) => {
  const [leads, setLeads] = useState(() => {
    const saved = localStorage.getItem('salesmate_leads');
    return saved ? JSON.parse(saved) : INITIAL_LEADS;
  });

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('salesmate_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [campaignRequests, setCampaignRequests] = useState(() => {
    const saved = localStorage.getItem('salesmate_campaign_requests');
    return saved ? JSON.parse(saved) : [
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
  });

  useEffect(() => {
    localStorage.setItem('salesmate_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('salesmate_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('salesmate_campaign_requests', JSON.stringify(campaignRequests));
  }, [campaignRequests]);

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
    const newTask = {
      id: Date.now().toString(),
      completed: false,
      ...task
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
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
