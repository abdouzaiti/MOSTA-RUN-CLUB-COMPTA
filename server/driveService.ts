import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

// Fallback directory for local storage if Google Drive is not configured or fails
const LOCAL_STORAGE_DIR = path.join(process.cwd(), "local_storage");
if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
  fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
}

let driveInstance: any = null;
let isGoogleConfigured = false;
let rootFolderId: string | null = null;
const ROOT_FOLDER_NAME = "MostaRunClub_Storage";

/**
 * Lazy initialization of the Google Drive client
 */
export function initDrive() {
  if (driveInstance) return driveInstance;

  try {
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;

    let auth;

    if (serviceAccountKey) {
      console.log("Initializing Google Drive with GOOGLE_SERVICE_ACCOUNT_KEY...");
      const credentials = JSON.parse(serviceAccountKey);
      auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ["https://www.googleapis.com/auth/drive"]
      });
      isGoogleConfigured = true;
    } else if (clientEmail && privateKey) {
      console.log("Initializing Google Drive with GOOGLE_CLIENT_EMAIL & GOOGLE_PRIVATE_KEY...");
      const formattedKey = privateKey.replace(/\\n/g, "\n");
      auth = new google.auth.JWT({
        email: clientEmail,
        key: formattedKey,
        scopes: ["https://www.googleapis.com/auth/drive"]
      });
      isGoogleConfigured = true;
    } else {
      console.log("No explicit service account keys found in environment variables. Google Drive will run in local storage fallback mode.");
      isGoogleConfigured = false;
      return null;
    }

    driveInstance = google.drive({ version: "v3", auth: auth as any });
    return driveInstance;
  } catch (error: any) {
    console.error("Failed to initialize Google Drive service:", error.message || error);
    driveInstance = null;
    isGoogleConfigured = false;
    return null;
  }
}

export function getIsGoogleConfigured(): boolean {
  initDrive();
  return isGoogleConfigured;
}

/**
 * Resolves or creates the ROOT folder on Google Drive
 */
async function getOrCreateRootFolder(drive: any): Promise<string> {
  if (rootFolderId) return rootFolderId;

  try {
    // Search for root folder
    const res = await drive.files.list({
      q: `name = '${ROOT_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id)",
      spaces: "drive",
    });

    if (res.data.files && res.data.files.length > 0) {
      rootFolderId = res.data.files[0].id;
      return rootFolderId!;
    }

    // Create root folder if not exists
    const folderMetadata = {
      name: ROOT_FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
    };

    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: "id",
    });

    rootFolderId = folder.data.id;
    console.log(`Created root folder '${ROOT_FOLDER_NAME}' on Google Drive with ID: ${rootFolderId}`);
    return rootFolderId!;
  } catch (err: any) {
    console.error("Failed to get or create root folder on Google Drive:", err.message || err);
    throw err;
  }
}

/**
 * Resolves or creates a folder structure recursively on Google Drive
 * e.g. "Events/Outing_2026/Images"
 */
export async function getOrCreateFolderByPath(folderPath: string): Promise<string> {
  const drive = initDrive();
  if (!drive || !isGoogleConfigured) {
    // Local fallback: return local folder path as "id"
    const localPath = path.join(LOCAL_STORAGE_DIR, folderPath);
    if (!fs.existsSync(localPath)) {
      fs.mkdirSync(localPath, { recursive: true });
    }
    return folderPath;
  }

  try {
    const rootId = await getOrCreateRootFolder(drive);
    const parts = folderPath.split("/").filter(Boolean);
    let parentId = rootId;

    for (const part of parts) {
      // Find sub-folder under parentId
      const q = `name = '${part}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const res = await drive.files.list({ q, fields: "files(id)" });

      if (res.data.files && res.data.files.length > 0) {
        parentId = res.data.files[0].id;
      } else {
        // Create subfolder
        const folderMetadata = {
          name: part,
          mimeType: "application/vnd.google-apps.folder",
          parents: [parentId],
        };
        const folder = await drive.files.create({
          resource: folderMetadata,
          fields: "id",
        });
        parentId = folder.data.id;
      }
    }

    return parentId;
  } catch (err: any) {
    console.warn("Google Drive folder resolution failed, falling back to local paths:", err.message || err);
    // Local fallback
    const localPath = path.join(LOCAL_STORAGE_DIR, folderPath);
    if (!fs.existsSync(localPath)) {
      fs.mkdirSync(localPath, { recursive: true });
    }
    return folderPath;
  }
}

/**
 * Upload a file buffer to Google Drive (or local storage fallback)
 */
export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  folderPath: string
): Promise<{ id: string; name: string; mimeType: string }> {
  const drive = initDrive();
  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniqueName = `${Date.now()}_${cleanName}`;

  if (!drive || !isGoogleConfigured) {
    // Local Storage fallback
    const localFolderPath = path.join(LOCAL_STORAGE_DIR, folderPath);
    if (!fs.existsSync(localFolderPath)) {
      fs.mkdirSync(localFolderPath, { recursive: true });
    }

    const localFilePath = path.join(localFolderPath, uniqueName);
    await fs.promises.writeFile(localFilePath, fileBuffer);

    // Use a composite ID format for local files so the stream can retrieve them: "local__<folderPath>__<uniqueName>"
    const encodedPath = encodeURIComponent(folderPath);
    const localId = `local__${encodedPath}__${uniqueName}`;

    return {
      id: localId,
      name: fileName,
      mimeType,
    };
  }

  try {
    const parentFolderId = await getOrCreateFolderByPath(folderPath);

    const fileMetadata = {
      name: uniqueName,
      parents: [parentFolderId],
    };

    const media = {
      mimeType: mimeType,
      body: Readable.from(fileBuffer),
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id, name, mimeType",
    });

    return {
      id: file.data.id,
      name: fileName,
      mimeType,
    };
  } catch (err: any) {
    console.warn("Google Drive upload failed, saving locally:", err.message || err);
    
    // Save locally
    const localFolderPath = path.join(LOCAL_STORAGE_DIR, folderPath);
    if (!fs.existsSync(localFolderPath)) {
      fs.mkdirSync(localFolderPath, { recursive: true });
    }

    const localFilePath = path.join(localFolderPath, uniqueName);
    await fs.promises.writeFile(localFilePath, fileBuffer);

    const encodedPath = encodeURIComponent(folderPath);
    const localId = `local__${encodedPath}__${uniqueName}`;

    return {
      id: localId,
      name: fileName,
      mimeType,
    };
  }
}

/**
 * Delete a file by Google Drive ID (or local storage fallback)
 */
export async function deleteFileFromDrive(fileId: string): Promise<void> {
  if (fileId.startsWith("local__")) {
    try {
      const parts = fileId.split("__");
      const folderPath = decodeURIComponent(parts[1]);
      const fileName = parts[2];
      const filePath = path.join(LOCAL_STORAGE_DIR, folderPath, fileName);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        console.log(`Deleted local file: ${filePath}`);
      }
    } catch (err) {
      console.error("Failed to delete local file:", err);
    }
    return;
  }

  const drive = initDrive();
  if (!drive || !isGoogleConfigured) return;

  try {
    await drive.files.delete({ fileId });
    console.log(`Deleted Google Drive file: ${fileId}`);
  } catch (err: any) {
    console.error(`Failed to delete Google Drive file ${fileId}:`, err.message || err);
  }
}

/**
 * Rename a file on Google Drive (or local storage fallback)
 */
export async function renameFileInDrive(fileId: string, newName: string): Promise<void> {
  if (fileId.startsWith("local__")) {
    try {
      const parts = fileId.split("__");
      const folderPath = decodeURIComponent(parts[1]);
      const oldFileName = parts[2];
      const oldFilePath = path.join(LOCAL_STORAGE_DIR, folderPath, oldFileName);
      
      const cleanNewName = newName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const uniqueNewName = `${Date.now()}_${cleanNewName}`;
      const newFilePath = path.join(LOCAL_STORAGE_DIR, folderPath, uniqueNewName);

      if (fs.existsSync(oldFilePath)) {
        await fs.promises.rename(oldFilePath, newFilePath);
        console.log(`Renamed local file to: ${newFilePath}`);
      }
    } catch (err) {
      console.error("Failed to rename local file:", err);
    }
    return;
  }

  const drive = initDrive();
  if (!drive || !isGoogleConfigured) return;

  try {
    await drive.files.update({
      fileId,
      resource: { name: newName },
    });
    console.log(`Renamed Google Drive file ${fileId} to '${newName}'`);
  } catch (err: any) {
    console.error(`Failed to rename Google Drive file ${fileId}:`, err.message || err);
  }
}

/**
 * Move a file to a different folder path (or local storage fallback)
 */
export async function moveFileInDrive(fileId: string, newFolderPath: string): Promise<void> {
  if (fileId.startsWith("local__")) {
    try {
      const parts = fileId.split("__");
      const oldFolderPath = decodeURIComponent(parts[1]);
      const fileName = parts[2];
      const oldFilePath = path.join(LOCAL_STORAGE_DIR, oldFolderPath, fileName);

      const newLocalFolderPath = path.join(LOCAL_STORAGE_DIR, newFolderPath);
      if (!fs.existsSync(newLocalFolderPath)) {
        fs.mkdirSync(newLocalFolderPath, { recursive: true });
      }
      const newFilePath = path.join(newLocalFolderPath, fileName);

      if (fs.existsSync(oldFilePath)) {
        await fs.promises.rename(oldFilePath, newFilePath);
        console.log(`Moved local file to: ${newFilePath}`);
      }
    } catch (err) {
      console.error("Failed to move local file:", err);
    }
    return;
  }

  const drive = initDrive();
  if (!drive || !isGoogleConfigured) return;

  try {
    // 1. Get current parents to remove
    const file = await drive.files.get({
      fileId,
      fields: "parents",
    });
    const previousParents = (file.data.parents || []).join(",");

    // 2. Resolve destination parent folder
    const destinationFolderId = await getOrCreateFolderByPath(newFolderPath);

    // 3. Move file
    await drive.files.update({
      fileId,
      addParents: destinationFolderId,
      removeParents: previousParents,
      fields: "id, parents",
    });
    console.log(`Moved Google Drive file ${fileId} to folder: ${newFolderPath}`);
  } catch (err: any) {
    console.error(`Failed to move Google Drive file ${fileId}:`, err.message || err);
  }
}

/**
 * Retrieve a file stream or buffer from Google Drive (or local storage fallback)
 */
export async function getFileFromDrive(fileId: string): Promise<{ stream: NodeJS.ReadableStream; mimeType: string }> {
  if (fileId.startsWith("local__")) {
    const parts = fileId.split("__");
    const folderPath = decodeURIComponent(parts[1]);
    const fileName = parts[2];
    const filePath = path.join(LOCAL_STORAGE_DIR, folderPath, fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found in local storage: ${filePath}`);
    }

    // Deduce standard mime types
    let mimeType = "application/octet-stream";
    const ext = path.extname(fileName).toLowerCase();
    if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
    else if (ext === ".png") mimeType = "image/png";
    else if (ext === ".gif") mimeType = "image/gif";
    else if (ext === ".webm") mimeType = "video/webm";
    else if (ext === ".mp4") mimeType = "video/mp4";
    else if (ext === ".mp3" || ext === ".webm" || ext === ".wav") mimeType = "audio/webm";

    const stream = fs.createReadStream(filePath);
    return { stream, mimeType };
  }

  const drive = initDrive();
  if (!drive || !isGoogleConfigured) {
    throw new Error("Google Drive is not initialized or configured.");
  }

  try {
    // Get metadata to find MIME type
    const metadata = await drive.files.get({
      fileId,
      fields: "mimeType",
    });

    const mimeType = metadata.data.mimeType || "application/octet-stream";

    // Get file media stream
    const response = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );

    return {
      stream: response.data as NodeJS.ReadableStream,
      mimeType,
    };
  } catch (err: any) {
    console.error(`Failed to fetch file stream for ${fileId} from Google Drive:`, err.message || err);
    throw err;
  }
}

/**
 * Get file metadata from Google Drive (or local fallback)
 */
export async function getFileMetadata(fileId: string): Promise<any> {
  if (fileId.startsWith("local__")) {
    const parts = fileId.split("__");
    const folderPath = decodeURIComponent(parts[1]);
    const fileName = parts[2];
    const filePath = path.join(LOCAL_STORAGE_DIR, folderPath, fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const stats = fs.statSync(filePath);
    return {
      id: fileId,
      name: fileName,
      size: stats.size,
      createdTime: stats.birthtime.toISOString(),
    };
  }

  const drive = initDrive();
  if (!drive || !isGoogleConfigured) {
    throw new Error("Google Drive is not configured");
  }

  try {
    const file = await drive.files.get({
      fileId,
      fields: "id, name, mimeType, size, createdTime",
    });
    return file.data;
  } catch (err: any) {
    console.error(`Failed to get metadata for Google Drive file ${fileId}:`, err.message || err);
    throw err;
  }
}
