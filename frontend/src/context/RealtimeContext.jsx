/* eslint react-refresh/only-export-components: "off" */
import { createContext, useContext } from 'react';

const RealtimeContext = createContext({
  subscribeToProperty: () => {},
  unsubscribeFromProperty: () => {},
});

export const useRealtime = () => useContext(RealtimeContext);

export default RealtimeContext;
