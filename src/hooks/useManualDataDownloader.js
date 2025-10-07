import { useState, useCallback } from 'react';
import axios from 'utils/axios';

const useManualDataDownloader = () => {
  const [downloadStates, setDownloadStates] = useState({
    lokasiKerja: { status: 'idle', progress: 0, lastUpdate: null, error: null },
    kegiatanKerja: { status: 'idle', progress: 0, lastUpdate: null, error: null },
    equipment: { status: 'idle', progress: 0, lastUpdate: null, error: null },
    material: { status: 'idle', progress: 0, lastUpdate: null, error: null },
    karyawan: { status: 'idle', progress: 0, lastUpdate: null, error: null },
    penyewa: { status: 'idle', progress: 0, lastUpdate: null, error: null },
    cabang: { status: 'idle', progress: 0, lastUpdate: null, error: null }
  });

  const updateDownloadState = useCallback((dataType, updates) => {
    setDownloadStates(prev => ({
      ...prev,
      [dataType]: { ...prev[dataType], ...updates }
    }));
  }, []);

  const downloadData = useCallback(async (dataType) => {
    try {
      updateDownloadState(dataType, { status: 'downloading', progress: 0, error: null });

      const endpoints = {
        lokasiKerja: '/api/manual-download/lokasi-kerja',
        kegiatanKerja: '/api/manual-download/kegiatan-kerja',
        equipment: '/api/manual-download/equipment',
        material: '/api/manual-download/material-mining',
        karyawan: '/api/manual-download/user-access',
        penyewa: '/api/manual-download/dom',
        cabang: '/api/manual-download/dom'
      };

      const endpoint = endpoints[dataType];
      if (!endpoint) {
        throw new Error(`Unknown data type: ${dataType}`);
      }

      const response = await axios.get(endpoint, {
        timeout: 30000,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.data && response.data.success) {
        updateDownloadState(dataType, { 
          status: 'completed', 
          progress: 100, 
          lastUpdate: new Date().toISOString(),
          error: null 
        });
        
        return { success: true, data: response.data.data };
      } else {
        throw new Error(response.data?.message || 'Failed to download data');
      }
    } catch (error) {
      console.error(`Error downloading ${dataType}:`, error);
      updateDownloadState(dataType, { 
        status: 'error', 
        progress: 0, 
        error: error.message || 'Download failed' 
      });
      
      return { success: false, error: error.message };
    }
  }, [updateDownloadState]);

  const downloadAllData = useCallback(async () => {
    const dataTypes = Object.keys(downloadStates);
    const results = {};

    for (const dataType of dataTypes) {
      results[dataType] = await downloadData(dataType);
    }

    return results;
  }, [downloadStates, downloadData]);

  const resetDownloadState = useCallback((dataType) => {
    updateDownloadState(dataType, { 
      status: 'idle', 
      progress: 0, 
      error: null 
    });
  }, [updateDownloadState]);

  const resetAllDownloadStates = useCallback(() => {
    const resetStates = {};
    Object.keys(downloadStates).forEach(dataType => {
      resetStates[dataType] = { 
        status: 'idle', 
        progress: 0, 
        lastUpdate: downloadStates[dataType].lastUpdate,
        error: null 
      };
    });
    setDownloadStates(resetStates);
  }, [downloadStates]);

  const getOverallProgress = useCallback(() => {
    const states = Object.values(downloadStates);
    const totalProgress = states.reduce((sum, state) => sum + state.progress, 0);
    return Math.round(totalProgress / states.length);
  }, [downloadStates]);

  const getOverallStatus = useCallback(() => {
    const states = Object.values(downloadStates);
    
    if (states.every(state => state.status === 'completed')) {
      return 'completed';
    }
    
    if (states.some(state => state.status === 'downloading')) {
      return 'downloading';
    }
    
    if (states.some(state => state.status === 'error')) {
      return 'error';
    }
    
    return 'idle';
  }, [downloadStates]);

  return {
    downloadStates,
    downloadData,
    downloadAllData,
    resetDownloadState,
    resetAllDownloadStates,
    getOverallProgress,
    getOverallStatus
  };
};

export default useManualDataDownloader;