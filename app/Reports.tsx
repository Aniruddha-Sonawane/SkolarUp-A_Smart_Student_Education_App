
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { db } from "../firebaseconfig";
import { ref, onValue } from "firebase/database";

interface Report {
  id: string;
  name: string;
  message: string;
  timestamp: string;
}

export default function ReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reportsRef = ref(db, "userReports");

    const unsubscribe = onValue(reportsRef, (snapshot) => {
      const data = snapshot.val();
      const allReports: Report[] = [];

      if (data) {
        Object.entries(data).forEach(([userId, reportData]: any) => {
          if (
            reportData &&
            reportData.name &&
            reportData.message &&
            reportData.timestamp
          ) {
            allReports.push({
              id: userId,
              name: reportData.name,
              message: reportData.message,
              timestamp: reportData.timestamp,
            });
          }
        });

        
        allReports.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }

      setReports(allReports);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 15 }}>
      {reports.length === 0 ? (
        <Text style={styles.noReportsText}>No reports available.</Text>
      ) : (
        reports.map((report) => (
          <View key={report.id} style={styles.reportCard}>
            <Text style={styles.name}>{report.name}</Text>
            <Text style={styles.message}>{report.message}</Text>
            <Text style={styles.timestamp}>
              {new Date(report.timestamp).toLocaleString()}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  reportCard: {
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2, 
  },
  name: { fontWeight: "bold", fontSize: 16, marginBottom: 6 },
  message: { fontSize: 14, marginBottom: 6 },
  timestamp: { fontSize: 12, color: "#666" },
  noReportsText: { textAlign: "center", marginTop: 50, color: "#999" },
});
