import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PAGE_PATHS } from './routes/paths';

const NavigationContext = createContext(null);

export const NavigationProvider = ({ children }) => {
  const navigate = useNavigate();
  const [selectedLeadId, setSelectedLeadIdState] = useState(null);

  // Call sites do `setSelectedLeadId(id); setPage('leadDetails')` inside one
  // handler, so setPage cannot read the id from state — that update has not
  // been applied yet. Mirror it into a ref that updates synchronously.
  const selectedLeadIdRef = useRef(null);

  const setSelectedLeadId = useCallback((id) => {
    selectedLeadIdRef.current = id;
    setSelectedLeadIdState(id);
  }, []);

  const setPage = useCallback((pageId) => {
    if (pageId === 'leadDetails') {
      const id = selectedLeadIdRef.current;
      navigate(id ? `/lead/${id}` : PAGE_PATHS.crm);
      return;
    }
    navigate(PAGE_PATHS[pageId] || PAGE_PATHS.dashboard);
  }, [navigate]);

  const value = useMemo(
    () => ({ setPage, selectedLeadId, setSelectedLeadId }),
    [setPage, selectedLeadId, setSelectedLeadId]
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => useContext(NavigationContext);

/**
 * Renders a page with the props it used to receive from App.jsx's switch.
 * Passing setPage/setSelectedLeadId to pages that ignore them is harmless and
 * means no page component had to change when the router landed.
 */
export const Page = ({ component: Component, ...extraProps }) => {
  const { setPage, setSelectedLeadId } = useNavigation();
  return (
    <Component
      setPage={setPage}
      setSelectedLeadId={setSelectedLeadId}
      {...extraProps}
    />
  );
};
