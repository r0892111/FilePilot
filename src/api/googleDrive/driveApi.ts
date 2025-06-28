
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



export const fetchGoogleDriveFolderFiles = async (folderId: string, accessToken: string) => {
    const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const fields = encodeURIComponent('files(id,name,mimeType,parents)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=100`;

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!res.ok) throw new Error(`Error fetching files: ${res.statusText}`);
    const data = await res.json();
    return data.files;
}

export const fetchGoogleDriveFolders = async (accessToken: string) => {
    console.log(accessToken);
    try {
        const url = "https://www.googleapis.com/drive/v3/files"
            + "?q=" + encodeURIComponent("mimeType = 'application/vnd.google-apps.folder' and trashed = false")
            + "&fields=" + encodeURIComponent('files(id,name,mimeType,parents)')
            + "&pageSize=1000";

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch folders');
        }
        const data = await response.json();
        console.log(data);
        // data.files is an array of folder objects
        return data.files;
    } catch (error) {
        console.error('Google Drive API error:', error);
        return [];
    }
};