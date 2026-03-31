import { useState, useCallback } from 'react'
import { Alert } from 'react-native'

// Mock API functions - replace with actual API calls
const crewWorksheetApi = {
  getPendingWorksheets: async () => {
    // Replace with actual API call
    try {
      const response = await fetch('/api/operation/crew-workhours?status=P')
      const data = await response.json()
      return data
    } catch (error) {
      throw new Error('Failed to fetch pending worksheets')
    }
  },

  approveWorksheet: async (id, komentar_spv = '') => {
    // Replace with actual API call
    try {
      const response = await fetch(`/api/operation/crew-workhours/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ komentar_spv }),
      })
      const data = await response.json()
      return data
    } catch (error) {
      throw new Error('Failed to approve worksheet')
    }
  },

  rejectWorksheet: async (id, komentar_spv = '') => {
    // Replace with actual API call
    try {
      const response = await fetch(`/api/operation/crew-workhours/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ komentar_spv }),
      })
      const data = await response.json()
      return data
    } catch (error) {
      throw new Error('Failed to reject worksheet')
    }
  },

  getWorksheetDetail: async (id) => {
    // Replace with actual API call
    try {
      const response = await fetch(`/api/operation/crew-workhours/${id}`)
      const data = await response.json()
      return data
    } catch (error) {
      throw new Error('Failed to fetch worksheet detail')
    }
  }
}

export const useCrewWorksheet = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getPendingWorksheets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await crewWorksheetApi.getPendingWorksheets()
      return result
    } catch (err) {
      setError(err.message)
      Alert.alert('Error', err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const approveWorksheet = useCallback(async (id, komentar_spv = '') => {
    try {
      setLoading(true)
      setError(null)
      const result = await crewWorksheetApi.approveWorksheet(id, komentar_spv)
      return result
    } catch (err) {
      setError(err.message)
      Alert.alert('Error', err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const rejectWorksheet = useCallback(async (id, komentar_spv = '') => {
    try {
      setLoading(true)
      setError(null)
      const result = await crewWorksheetApi.rejectWorksheet(id, komentar_spv)
      return result
    } catch (err) {
      setError(err.message)
      Alert.alert('Error', err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getWorksheetDetail = useCallback(async (id) => {
    try {
      setLoading(true)
      setError(null)
      const result = await crewWorksheetApi.getWorksheetDetail(id)
      return result
    } catch (err) {
      setError(err.message)
      Alert.alert('Error', err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    getPendingWorksheets,
    approveWorksheet,
    rejectWorksheet,
    getWorksheetDetail
  }
}