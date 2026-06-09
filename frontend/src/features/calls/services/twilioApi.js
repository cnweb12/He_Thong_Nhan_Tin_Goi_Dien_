import apiClient from '../../../services/apiClient';

export const fetchTwilioToken = async (accessToken) => {
  const response = await apiClient.get('/api/twilio/token', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    throw new Error(response.error || 'Failed to fetch Twilio token');
  }
  return response.data.data.token;
};
