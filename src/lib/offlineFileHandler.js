import { writeFile, readFile, mkdir, exists } from '@tauri-apps/plugin-fs';
import { appDataDir } from '@tauri-apps/api/path';

export async function savePhotoOffline(file, id) {
  try {
    const dataDir = await appDataDir();
    const photoDir = `${dataDir}/offline-photos`;
    
    const dirExists = await exists(photoDir);
    if (!dirExists) {
      await mkdir(photoDir, { recursive: true });
    }
    
    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `${photoDir}/${id}.${ext}`;
    
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    await writeFile(filePath, uint8Array);
    
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('📸 Photo saved offline:', filePath);
    }
    
    return filePath;
  } catch (error) {
    console.error('Error saving photo offline:', error);
    throw error;
  }
}

export async function readPhotoOffline(filePath) {
  try {
    const uint8Array = await readFile(filePath);
    const blob = new Blob([uint8Array]);
    return blob;
  } catch (error) {
    console.error('Error reading photo offline:', error);
    throw error;
  }
}

export async function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function prepareFormDataForOffline(formData) {
  const data = {};
  const files = {};
  
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      const base64 = await convertFileToBase64(value);
      files[key] = {
        name: value.name,
        type: value.type,
        size: value.size,
        base64: base64
      };
    } else {
      data[key] = value;
    }
  }
  
  return { data, files };
}

export async function reconstructFormData(offlineData) {
  const formData = new FormData();
  
  if (offlineData.data) {
    for (const [key, value] of Object.entries(offlineData.data)) {
      formData.append(key, value);
    }
  }
  
  if (offlineData.files) {
    for (const [key, fileInfo] of Object.entries(offlineData.files)) {
      const base64Response = await fetch(fileInfo.base64);
      const blob = await base64Response.blob();
      const file = new File([blob], fileInfo.name, { type: fileInfo.type });
      formData.append(key, file);
    }
  }
  
  return formData;
}
