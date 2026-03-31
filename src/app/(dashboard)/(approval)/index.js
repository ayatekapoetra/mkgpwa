import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { Card, Title, Paragraph } from 'react-native-paper'
import { colors } from '../../../constants/colors'

const ApprovalIndex = () => {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Approval Management</Title>
            <Paragraph style={styles.description}>
              Manage and approve various workflow items that require your attention.
            </Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Crew Worksheet Approval</Title>
            <Paragraph style={styles.cardDescription}>
              Review and approve crew work hours submitted by team members.
            </Paragraph>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
})

export default ApprovalIndex