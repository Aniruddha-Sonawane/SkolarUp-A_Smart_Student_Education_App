// app/liveChat.tsx
import React, { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { db } from "../firebaseconfig";
import { ref, onValue } from "firebase/database";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot" | "admin";
  session?: string;
  timestamp?: number;
}

export default function LiveChatScreen({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const sessionsRef = ref(db, "chatbot/device_1");

    const unsubscribe = onValue(sessionsRef, snapshot => {
      const data = snapshot.val() || {};
      let combined: Message[] = [];

      for (const session in data) {
        const msgs: Message[] = Object.values(data[session]).map((m: any) => ({
          ...m,
          session,
        }));
        combined = [...combined, ...msgs];
      }

      combined.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      setMessages(combined);
      setLoading(false);

      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => unsubscribe();
  }, []);

  const formatTime = (ts?: number) =>
    ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2E86DE" />
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
      <TouchableOpacity onPress={onClose} style={{ padding: 10, backgroundColor: "#2E86DE" }}>
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Close Live Chat</Text>
      </TouchableOpacity>

      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 15 }}>
        {messages.map((msg, index) => (
          <View
            key={`${msg.session || "nosession"}-${msg.id || index}`}
            style={[styles.messageBubble, msg.sender === "bot" ? styles.botBubble : styles.userBubble]}
          >
            <Text style={{ fontWeight: "bold", marginBottom: 2, color: "#555" }}>
              [{msg.session}] {msg.sender?.toUpperCase()}
            </Text>
            <Text style={styles.messageText}>{msg.text}</Text>
            <Text style={styles.timestamp}>{formatTime(msg.timestamp)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  messageBubble: { marginVertical: 5, padding: 10, borderRadius: 10, maxWidth: "80%", alignSelf: "flex-start" },
  userBubble: { backgroundColor: "#d1f0ff", alignSelf: "flex-end" },
  botBubble: { backgroundColor: "#f0f0f0", alignSelf: "flex-start" },
  messageText: { fontSize: 16 },
  timestamp: { fontSize: 10, color: "#555", marginTop: 5, textAlign: "right" },
});
