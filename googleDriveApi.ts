export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  parents?: string[];
  shared?: boolean;
}

export interface DriveStorageQuota {
  limit?: string;
  usage?: string;
  usageInDrive?: string;
  usageInDriveTrash?: string;
}

export interface DriveAboutInfo {
  user: {
    displayName: string;
    emailAddress: string;
    photoLink?: string;
  };
  storageQuota?: DriveStorageQuota;
}

/**
 * Get user information and storage quota from Google Drive API
 */
export async function getDriveAbout(token: string): Promise<DriveAboutInfo> {
  const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Google Drive API error: ${res.status}`);
  }

  return await res.json();
}

/**
 * List files and folders in Google Drive
 */
export async function listDriveFiles(
  token: string,
  options?: {
    folderId?: string | null;
    search?: string;
    pageSize?: number;
    pageToken?: string;
  }
): Promise<{ files: DriveFileItem[]; nextPageToken?: string }> {
  const { folderId, search, pageSize = 40, pageToken } = options || {};

  const queryParts: string[] = ['trashed = false'];

  if (folderId) {
    queryParts.push(`'${folderId}' in parents`);
  }

  if (search && search.trim()) {
    const escaped = search.replace(/'/g, "\\'");
    queryParts.push(`name contains '${escaped}'`);
  }

  const q = encodeURIComponent(queryParts.join(' and '));
  const fields = encodeURIComponent(
    'nextPageToken, files(id, name, mimeType, size, webViewLink, webContentLink, iconLink, thumbnailLink, createdTime, modifiedTime, parents, shared)'
  );

  let url = `https://www.googleapis.com/drive/v3/files?q=${q}&pageSize=${pageSize}&fields=${fields}&orderBy=folder,modifiedTime desc`;
  if (pageToken) {
    url += `&pageToken=${encodeURIComponent(pageToken)}`;
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Google Drive List Files error: ${res.status}`);
  }

  return await res.json();
}

/**
 * Create a new folder in Google Drive
 */
export async function createDriveFolder(
  token: string,
  folderName: string,
  parentFolderId?: string
): Promise<DriveFileItem> {
  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create folder: ${res.status}`);
  }

  return await res.json();
}

/**
 * Upload binary file, image, PDF, or document to Google Drive via multipart upload
 */
export async function uploadFileToDrive(
  token: string,
  file: File | Blob,
  fileName: string,
  mimeType: string,
  parentFolderId?: string,
  description?: string
): Promise<DriveFileItem> {
  const metadata: any = {
    name: fileName,
    mimeType: mimeType || 'application/octet-stream',
    description: description || 'Uploaded from OGA Fleet Vehicle Management System',
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const reader = new FileReader();
  const fileDataPromise = new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

  const fileData = await fileDataPromise;
  const metadataBlob = new Blob([
    delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n` +
      'Content-Transfer-Encoding: binary\r\n\r\n',
  ]);

  const endBlob = new Blob([closeDelimiter]);
  const multipartBody = new Blob([metadataBlob, fileData, endBlob]);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,webContentLink,createdTime,modifiedTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to upload file to Google Drive: ${res.status}`);
  }

  return await res.json();
}

/**
 * Upload JSON Data (e.g. Backups) to Google Drive
 */
export async function uploadJsonToDrive(
  token: string,
  jsonData: any,
  fileName: string,
  parentFolderId?: string,
  description?: string
): Promise<DriveFileItem> {
  const jsonString = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  return await uploadFileToDrive(token, blob, fileName, 'application/json', parentFolderId, description);
}

/**
 * Upload CSV / Text file to Google Drive
 */
export async function uploadTextToDrive(
  token: string,
  content: string,
  fileName: string,
  mimeType: string = 'text/csv;charset=utf-8;',
  parentFolderId?: string
): Promise<DriveFileItem> {
  const blob = new Blob([content], { type: mimeType });
  return await uploadFileToDrive(token, blob, fileName, mimeType, parentFolderId);
}

/**
 * Delete a file or folder from Google Drive
 * (Note: Must always be preceded by UI user confirmation modal per Workspace guidelines)
 */
export async function deleteDriveFile(token: string, fileId: string): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete file from Google Drive: ${res.status}`);
  }
}

/**
 * Find or create standard OGA Fleet Folders in Google Drive
 */
export async function getOrCreateOgaFleetFolderHierarchy(token: string): Promise<{
  rootFolder: DriveFileItem;
  vehiclesFolder: DriveFileItem;
  maintenanceFolder: DriveFileItem;
  backupsFolder: DriveFileItem;
}> {
  // Check if OGA Fleet root folder exists
  const existingRoots = await listDriveFiles(token, {
    search: 'OGA Fleet Management',
    pageSize: 5,
  });

  let rootFolder = existingRoots.files.find(
    (f) => f.name === 'OGA Fleet Management' && f.mimeType === 'application/vnd.google-apps.folder'
  );

  if (!rootFolder) {
    rootFolder = await createDriveFolder(token, 'OGA Fleet Management');
  }

  // Find or create subfolders inside rootFolder
  const subFolders = await listDriveFiles(token, {
    folderId: rootFolder.id,
    pageSize: 20,
  });

  let vehiclesFolder = subFolders.files.find(
    (f) => f.name === 'เอกสารประจำรถ (Vehicle Documents)' && f.mimeType === 'application/vnd.google-apps.folder'
  );
  if (!vehiclesFolder) {
    vehiclesFolder = await createDriveFolder(token, 'เอกสารประจำรถ (Vehicle Documents)', rootFolder.id);
  }

  let maintenanceFolder = subFolders.files.find(
    (f) => f.name === 'ใบสั่งซ่อมและใบเสร็จ (Work Orders & Invoices)' && f.mimeType === 'application/vnd.google-apps.folder'
  );
  if (!maintenanceFolder) {
    maintenanceFolder = await createDriveFolder(token, 'ใบสั่งซ่อมและใบเสร็จ (Work Orders & Invoices)', rootFolder.id);
  }

  let backupsFolder = subFolders.files.find(
    (f) => f.name === 'สำรองข้อมูล & รายงาน (Backups & Reports)' && f.mimeType === 'application/vnd.google-apps.folder'
  );
  if (!backupsFolder) {
    backupsFolder = await createDriveFolder(token, 'สำรองข้อมูล & รายงาน (Backups & Reports)', rootFolder.id);
  }

  return {
    rootFolder,
    vehiclesFolder,
    maintenanceFolder,
    backupsFolder,
  };
}
