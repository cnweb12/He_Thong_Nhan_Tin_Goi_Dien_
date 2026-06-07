import apiClient from './apiClient';

export const uploadFilesApi = async (files, accessToken) => {
    const formData = new FormData();
    files.forEach(file => {
        formData.append('files', file);
    });

    const url = apiClient.buildApiUrl('/api/upload');
    const headers = {};
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            headers
        });

        const text = await response.text();
        let data = null;
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }

        if (!response.ok) {
            throw new Error(data?.message || data || 'Upload failed');
        }

        return data.data;
    } catch (error) {
        throw error;
    }
};
