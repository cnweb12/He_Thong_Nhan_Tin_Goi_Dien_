import { useContext } from 'react';
import { TwilioContext } from '../context/TwilioProvider';

export const useCall = () => {
  const context = useContext(TwilioContext);
  if (!context) {
    throw new Error('useCall must be used within a TwilioProvider');
  }
  return context;
};

export default useCall;
