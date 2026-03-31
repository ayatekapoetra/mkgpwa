import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Card, Title, Paragraph, Button } from 'react-native-paper'
import { colors } from '../../../../constants/colors'
import CustomAlert from '../../../../components/common/CustomAlert'
import { useCrewWorksheet } from '../../../../hooks/useCrewWorksheet'

const ApprovalWorksheetDetail = () => {
  const { id, data } = useLocalSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showApproveAlert, setShowApproveAlert] = useState(false)
  const [showRejectAlert, setShowRejectAlert] = useState(false)
  
  // Parse data if it's a string
  const worksheetData = typeof data === 'string' ? JSON.parse(data) : data
  
  // Mock hook - replace with actual implementation
  const { approveWorksheet, rejectWorksheet } = useCrewWorksheet()

  const handleApprove = async () => {
    try {
      setLoading(true)
      const response = await approveWorksheet(id)
      
      if (response.error) {
        Alert.alert('Error', response.message || 'Failed to approve worksheet')
      } else {
        Alert.alert('Success', 'Worksheet approved successfully')
        router.back()
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to approve worksheet')
    } finally {
      setLoading(false)
      setShowApproveAlert(false)
    }
  }

  const handleReject = async () => {
    try {
      setLoading(true)
      const response = await rejectWorksheet(id, { komentar_spv: '' })
      
      if (response.error) {
        Alert.alert('Error', response.message || 'Failed to reject worksheet')
      } else {
        Alert.alert('Success', 'Worksheet rejected successfully')
        router.back()
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to reject worksheet')
    } finally {
      setLoading(false)
      setShowRejectAlert(false)
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Worksheet Details</Title>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Tanggal:</Text>
              <Text style={styles.value}>{worksheetData?.tanggal}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Crew:</Text>
              <Text style={styles.value}>{worksheetData?.crew?.nama || '-'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Supervisor:</Text>
              <Text style={styles.value}>{worksheetData?.supervisor?.nama || '-'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Cabang:</Text>
              <Text style={styles.value}>{worksheetData?.cabang?.nama || '-'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Status:</Text>
              <View style={[styles.statusBadge, styles.pendingStatus]}>
                <Text style={styles.statusText}>Pending</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Keterangan:</Text>
              <Text style={styles.value}>{worksheetData?.keterangan || '-'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Jam Mulai:</Text>
              <Text style={styles.value}>{worksheetData?.jam_mulai || '-'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Jam Selesai:</Text>
              <Text style={styles.value}>{worksheetData?.jam_selesai || '-'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Istirahat Mulai:</Text>
              <Text style={styles.value}>{worksheetData?.istirahat_mulai || '-'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Istirahat Selesai:</Text>
              <Text style={styles.value}>{worksheetData?.istirahat_selesai || '-'}</Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={() => setShowRejectAlert(true)}
          style={[styles.button, styles.rejectButton]}
          textColor="#d32f2f"
          disabled={loading}
        >
          Tolak
        </Button>
        
        <Button
          mode="contained"
          onPress={() => setShowApproveAlert(true)}
          style={[styles.button, styles.approveButton]}
          disabled={loading}
          loading={loading}
        >
          Setujui
        </Button>
      </View>

      <CustomAlert
        visible={showApproveAlert}
        title="Konfirmasi Persetujuan"
        message="Apakah Anda yakin ingin menyetujui worksheet ini?"
        onConfirm={handleApprove}
        onCancel={() => setShowApproveAlert(false)}
        confirmText="Setujui"
        cancelText="Batal"
      />

      <CustomAlert
        visible={showRejectAlert}
        title="Konfirmasi Penolakan"
        message="Apakah Anda yakin ingin menolak worksheet ini?"
        onConfirm={handleReject}
        onCancel={() => setShowRejectAlert(false)}
        confirmText="Tolak"
        cancelText="Batal"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.primary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingStatus: {
    backgroundColor: '#fff3cd',
  },
  statusText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  rejectButton: {
    borderColor: '#d32f2f',
  },
  approveButton: {
    backgroundColor: colors.primary,
  },
})

export default ApprovalWorksheetDetail