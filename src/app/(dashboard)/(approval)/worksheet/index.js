import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native'
import { useNavigation } from 'expo-router'
import { Card, Title, Paragraph } from 'react-native-paper'
import { colors } from '../../../../constants/colors'
import { useCrewWorksheet } from '../../../../hooks/useCrewWorksheet'

const ApprovalWorksheetList = () => {
  const navigation = useNavigation()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [worksheets, setWorksheets] = useState([])
  
  // Mock hook - replace with actual implementation
  const { getPendingWorksheets } = useCrewWorksheet()

  const loadWorksheets = async () => {
    try {
      setLoading(true)
      // Replace with actual API call
      const response = await getPendingWorksheets()
      setWorksheets(response?.data || [])
    } catch (error) {
      Alert.alert('Error', 'Failed to load worksheets')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadWorksheets()
    setRefreshing(false)
  }

  const handleWorksheetPress = (worksheet) => {
    navigation.push('(approval)/worksheet/[id]', { 
      id: worksheet.id, 
      data: worksheet 
    })
  }

  useEffect(() => {
    loadWorksheets()
  }, [])

  const renderWorksheetCard = ({ item }) => (
    <TouchableOpacity onPress={() => handleWorksheetPress(item)}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.title}>{item.tanggal}</Title>
            <View style={[styles.statusBadge, styles.pendingStatus]}>
              <Text style={styles.statusText}>Pending</Text>
            </View>
          </View>
          <Paragraph style={styles.paragraph}>Crew: {item.crew?.nama || '-'}</Paragraph>
          <Paragraph style={styles.paragraph}>Cabang: {item.cabang?.nama || '-'}</Paragraph>
          <Paragraph style={styles.paragraph}>Keterangan: {item.keterangan}</Paragraph>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Approval Worksheet</Text>
      
      <FlatList
        data={worksheets}
        renderItem={renderWorksheetCard}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No pending worksheets</Text>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.primary,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
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
  paragraph: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
})

export default ApprovalWorksheetList