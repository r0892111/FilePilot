
export const fetchGoogleDriveFiles = async (accessToken: string) => {
    try {
        const response = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=100&fields=files(id,name,parents,mimeType)', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        console.log('Fetching Google Drive files with access token:', accessToken);
        if (!response.ok) {
            throw new Error('Failed to fetch files');
        }
        const data = await response.json();
        // data.files is an array of file objects
        return data.files;
    } catch (error) {
        console.error('Google Drive API error:', error);
        return [];
    }
};


