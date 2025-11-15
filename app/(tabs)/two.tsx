
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { db } from '../../firebaseconfig';
import { ref, onValue, push, set, get, remove, update, child } from 'firebase/database';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  ChatBot: undefined;
  Reports: undefined;
  LiveChat: undefined;
};

type ChatBotScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ChatBot'
>;

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'admin';
  timestamp?: number;
  session?: string;
}

export default function ChatBotScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
const [responses, setResponses] = useState<Record<string, string[]>>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminSessions, setAdminSessions] = useState<string[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionNode, setSessionNode] = useState<string | null>(null);
  const [botStarted, setBotStarted] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [botActive, setBotActive] = useState(true);
  const [initialMessageText, setInitialMessageText] = useState('');
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [liveChatMessages, setLiveChatMessages] = useState<Message[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const [terminalMode, setTerminalMode] = useState(false);
  const navigation = useNavigation<ChatBotScreenNavigationProp>();

  
  const fetchAdminSessions = async () => {
    const sessionsRef = ref(db, 'chatbot/device_1');
    const snapshot = await get(sessionsRef);
    const data = snapshot.val() || {};
    const sessionKeys = Object.keys(data);

    const sessionsWithTime: { key: string; firstTs: number }[] = [];
    for (let key of sessionKeys) {
      const messages = data[key];
      const firstMessage = Object.values(messages)[0] as any;
      const ts = firstMessage?.timestamp || 0;
      sessionsWithTime.push({ key, firstTs: ts });
    }

    sessionsWithTime.sort((a, b) => b.firstTs - a.firstTs);
    setAdminSessions(sessionsWithTime.map(s => s.key));
  };

  
  useEffect(() => {
  const responsesRef = ref(db, 'chatbot/responses');
  onValue(responsesRef, snapshot => {
    const data = snapshot.val();
    if (!data) {
      setResponses({});
      return;
    }
    
    
    const formattedResponses: Record<string, string[]> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        formattedResponses[key] = value;
      } else if (typeof value === 'string') {
        formattedResponses[key] = [value];
      } else if (value && typeof value === 'object') {
        
        formattedResponses[key] = Object.values(value).filter(v => typeof v === 'string') as string[];
      } else {
        formattedResponses[key] = [];
      }
    });
    
    setResponses(formattedResponses);
  });

  const passRef = ref(db, 'chatbot/adminPassword');
  onValue(passRef, snapshot => setAdminPassword(snapshot.val() || ''));

  const botActiveRef = ref(db, 'chatbot/botActive');
  onValue(botActiveRef, snapshot => setBotActive(snapshot.val() ?? true));

  const initMsgRef = ref(db, 'chatbot/initialMessage');
  onValue(initMsgRef, snapshot => {
    const text = snapshot.val();
    if (text) {
      setInitialMessageText(text);
      if (!botStarted) {
        const timestamp = Date.now();
        const initialMessage: Message = {
          id: timestamp.toString(),
          text,
          sender: 'bot',
          timestamp,
        };
        setMessages([initialMessage]);
        setBotStarted(true);
      }
    }
  });
}, []);

  
  useEffect(() => {
    const suggestionsRef = ref(db, 'chatbot/suggestions');
    onValue(suggestionsRef, snapshot => {
      const data = snapshot.val();
      if (!data) return setSuggestions([]);
      const arr = Array.isArray(data) ? data : Object.keys(data).map(key => data[key]);
      setSuggestions(arr);
    });
  }, []);

  
  useEffect(() => {
    if (sessionNode) {
      const sessionRef = ref(db, `chatbot/${sessionNode}`);
      const unsubscribe = onValue(sessionRef, snapshot => {
        const data = snapshot.val() || {};
        const msgs: Message[] = Object.keys(data).map(key => data[key]);
        setMessages(prev => {
          const init = prev.length > 0 ? prev[0] : null;
          const rest = msgs.filter(m => m.id !== init?.id);
          return init ? [init, ...rest] : [...rest];
        });
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      });
      return () => unsubscribe();
    }
  }, [sessionNode]);

  
  useEffect(() => {
    if (showLiveChat && isAdmin) {
      const sessionsRef = ref(db, 'chatbot/device_1');
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
        combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setLiveChatMessages(combined);
      });
      return () => unsubscribe();
    }
  }, [showLiveChat, isAdmin]);

  
  const handleTerminalCommand = async (input: string) => {
    const [cmd, ...args] = input.trim().split(" ");

    try {
      if (cmd === "set") {
        const path = args[0];
        const value = JSON.parse(args.slice(1).join(" "));
        await set(ref(db, path), value);
        return `✅ Set value at ${path}`;
      }

      if (cmd === "update") {
        const path = args[0];
        const value = JSON.parse(args.slice(1).join(" "));
        await update(ref(db, path), value);
        return `✅ Updated ${path}`;
      }

      if (cmd === "get") {
        const path = args[0];
        const snapshot = await get(ref(db, path));
        if (snapshot.exists()) {
          return `📦 Data at ${path}: ${JSON.stringify(snapshot.val(), null, 2)}`;
        } else {
          return `❌ No data at ${path}`;
        }
      }

      if (cmd === "list") {
        const path = args[0];
        const snapshot = await get(ref(db, path));
        if (snapshot.exists()) {
          return `📂 Keys under ${path}: ${Object.keys(snapshot.val()).join(", ")}`;
        } else {
          return `❌ No data at ${path}`;
        }
      }

      if (cmd === "remove") {
        const path = args[0];
        await remove(ref(db, path));
        return `🗑️ Removed ${path}`;
      }

      if (cmd === "dump") {
        const snapshot = await get(ref(db, "/"));
        if (snapshot.exists()) {
          return `🌍 Full Database:\n${JSON.stringify(snapshot.val(), null, 2)}`;
        } else {
          return "❌ Database is empty";
        }
      }

      if (cmd === "help") {
        return `
Available commands:
- set /path {...}
- update /path {...}
- get /path
- list /path
- remove /path
- dump   (full DB as JSON)
- help
- exit
        `;
      }

      if (cmd === "exit") {
        return "👋 Exiting terminal...";
      }

      return `❓ Unknown command: ${cmd}`;
    } catch (err: any) {
      return `⚠️ Error: ${err.message}`;
    }
  };
const findBestMatch = (userInput: string, responseDict: Record<string, string[]>) => {
  const input = userInput.toLowerCase().trim();
  
  
  for (const [key, value] of Object.entries(responseDict)) {
    if (key.toLowerCase() === input) {
      return { match: key, responses: value };
    }
  }
  
  
  for (const [key, value] of Object.entries(responseDict)) {
    if (key.toLowerCase().includes(input)) {
      return { match: key, responses: value };
    }
  }
  
  
  for (const [key, value] of Object.entries(responseDict)) {
    if (input.includes(key.toLowerCase())) {
      return { match: key, responses: value };
    }
  }
  
  return null;
};
  
const sendMessage = async (text: string) => {
  if (!text.trim()) return;
  const timestamp = Date.now();
  
  if (text.trim() === `${adminPassword} ani #r`) {
    setInput('');
    navigation.navigate('Reports');
    return;
  }
  
  if (text.trim() === `${adminPassword} ani #l`) {
    setInput('');
    navigation.navigate('LiveChat');
    return;
  }

  if (text.trim() === `${adminPassword} ani #t`) {
    setTerminalMode(true);
    setInput('');
    return;
  }
  
  if (text.trim() === `${adminPassword} ani #exit`) {
    setTerminalMode(false);
    setInput('');
    setMessages(prev => prev.filter(m => m.sender !== 'user' && m.sender !== 'bot'));
    return;
  }

  if (terminalMode) {
    const userMsg: Message = {
      id: timestamp.toString(),
      text,
      sender: 'user',
      timestamp,
    };
    setMessages(prev => [...prev, userMsg]);

    const outputText = await handleTerminalCommand(text);

    const outputMsg: Message = {
      id: (timestamp + 1).toString(),
      text: outputText,
      sender: 'bot',
      timestamp: timestamp + 1,
    };
    setMessages(prev => [...prev, outputMsg]);

    setInput('');
    return;
  }

  if (!sessionNode && !isAdmin && botStarted) {
    if (text === adminPassword) {
      setIsAdmin(true);
      fetchAdminSessions();
      setInput('');
      return;
    } else {
      const deviceId = 'device_1';
      let nodeName = text;

      const sessionsRef = ref(db, `chatbot/${deviceId}`);
      const snapshot = await get(sessionsRef);
      const data = snapshot.val() || {};
      let count = 1;
      let uniqueNodeName = nodeName;
      while (data[uniqueNodeName]) {
        uniqueNodeName = `${nodeName}_${count}`;
        count++;
      }
      nodeName = uniqueNodeName;

      const fullNode = `${deviceId}/${nodeName}`;
      setSessionNode(fullNode);

      const userMessage: Message = { id: timestamp.toString(), text, sender: 'user', timestamp };
      push(ref(db, `chatbot/${fullNode}`), userMessage);

      if (botActive) {
        
        const responsesRef = ref(db, 'chatbot/responses');
        const responsesSnapshot = await get(responsesRef);
        const allResponses = responsesSnapshot.val() || {};
        
        
        const matchedResponse = findBestMatch(text, allResponses);
        let responseText = "Sorry, I don't understand that.";
        
        if (matchedResponse) {
          
          responseText = Array.isArray(matchedResponse.responses) 
            ? matchedResponse.responses[0] 
            : matchedResponse.responses;
        }
        
        const botMessage: Message = {
          id: (timestamp + 1).toString(),
          text: responseText,
          sender: 'bot',
          timestamp: timestamp + 1,
        };
        push(ref(db, `chatbot/${fullNode}`), botMessage);

        
        const safeKey = responseText.replace(/[.#$/[\]]/g, "_");
const replySuggestionsRef = ref(db, `suggestionReply/${safeKey}`);
        get(replySuggestionsRef).then((snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            if (data) {
              
              const suggestionsArray = Object.values(data)
                .filter((suggestion): suggestion is string => 
                  typeof suggestion === 'string' && suggestion.trim() !== ""
                );
              setSuggestions(suggestionsArray);
            } else {
              setSuggestions([]);
            }
          } else {
            
            setSuggestions([]);
          }
        }).catch((error) => {
          console.error("Error fetching suggestions:", error);
          setSuggestions([]);
        });
      }

      setMessages(prev => [...prev, userMessage]);
      setInput('');
      return;
    }
  }

  if (sessionNode && !isAdmin) {
    const userMessage: Message = { id: timestamp.toString(), text, sender: 'user', timestamp };
    setInput('');
    push(ref(db, `chatbot/${sessionNode}`), userMessage);

    if (botActive) {
      
      const responsesRef = ref(db, 'chatbot/responses');
      const responsesSnapshot = await get(responsesRef);
      const allResponses = responsesSnapshot.val() || {};
      
      
      const matchedResponse = findBestMatch(text, allResponses);
      let responseText = "Sorry, I don't understand that.";
      
      if (matchedResponse) {
        
        responseText = Array.isArray(matchedResponse.responses) 
          ? matchedResponse.responses[0] 
          : matchedResponse.responses;
      }
      
      const botMessage: Message = {
        id: (timestamp + 1).toString(),
        text: responseText,
        sender: 'bot',
        timestamp: timestamp + 1,
      };
      push(ref(db, `chatbot/${sessionNode}`), botMessage);

      
      const safeKey = responseText.replace(/[.#$/[\]]/g, "_");
const replySuggestionsRef = ref(db, `suggestionReply/${safeKey}`);
      get(replySuggestionsRef).then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data) {
            
            const suggestionsArray = Object.values(data)
              .filter((suggestion): suggestion is string => 
                typeof suggestion === 'string' && suggestion.trim() !== ""
              );
            setSuggestions(suggestionsArray);
          } else {
            setSuggestions([]);
          }
        } else {
          
          setSuggestions([]);
        }
      }).catch((error) => {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      });
    }
  }

  if (isAdmin && selectedSession) {
    const adminMessage: Message = { id: timestamp.toString(), text, sender: 'admin', timestamp };
    setInput('');
    push(ref(db, `chatbot/device_1/${selectedSession}`), adminMessage);
  }
};
  
  const loadSession = (sessionName: string) => {
    setSelectedSession(sessionName);
    setMessages([]);
    setSessionNode(`device_1/${sessionName}`);
  };

  
  const handleBack = () => {
    setSelectedSession(null);
    setSessionNode(null);
    setMessages([]);
    setShowLiveChat(false);
  };

  
  const deleteAllSessions = async () => {
    const sessionsRef = ref(db, 'chatbot/device_1');
    Alert.alert('Confirm', 'Delete all sessions?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await remove(sessionsRef);
          setAdminSessions([]);
          setSelectedSession(null);
          setSessionNode(null);
          setMessages([]);
        },
      },
    ]);
  };

  
  const deleteSession = async (sessionName: string) => {
    const sessionRef = ref(db, `chatbot/device_1/${sessionName}`);
    Alert.alert('Confirm', `Delete session ${sessionName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await remove(sessionRef);
          fetchAdminSessions();
        },
      },
    ]);
  };

  const formatTime = (ts?: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  
  const renderTerminal = () => (
    <Modal visible={terminalMode} animationType="slide">
      <View style={{ flex: 1, backgroundColor: '#000', padding: 10 }}>
        <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 80 }}>
          {messages.map((msg, index) => (
            <Text
              key={index}
              style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 5 }}
            >
              {`>>> ${msg.text}`}
            </Text>
          ))}
        </ScrollView>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: '#0f0', fontFamily: 'monospace', marginRight: 5 }}>{'>>>'}</Text>
          <TextInput
            style={{
              flex: 1,
              color: '#0f0',
              backgroundColor: '#000',
              borderBottomWidth: 1,
              borderBottomColor: '#0f0',
              fontFamily: 'monospace',
              padding: 5,
            }}
            placeholder="Enter command..."
            placeholderTextColor="#0f0"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendMessage(input)}
          />
        </View>
      </View>
    </Modal>
  );

  
  if (isAdmin && !selectedSession) {
    return (
      <View style={{ flex: 1, padding: 15 }}>
        {renderTerminal()}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <TouchableOpacity
            onPress={fetchAdminSessions}
            style={{ padding: 10, backgroundColor: '#2E86DE', borderRadius: 10 }}
          >
            <Text style={{ color: '#fff' }}>Refresh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowLiveChat(prev => !prev)}
            style={{ padding: 10, backgroundColor: '#28B463', borderRadius: 10, marginHorizontal: 5 }}
          >
            <Text style={{ color: '#fff' }}>Live Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={deleteAllSessions}
            style={{ padding: 10, backgroundColor: '#E74C3C', borderRadius: 10 }}
          >
            <Text style={{ color: '#fff' }}>Delete All</Text>
          </TouchableOpacity>
        </View>

        {showLiveChat ? (
          <ScrollView style={{ flex: 1 }}>
            {liveChatMessages.map((msg, index) => (
              <View
                key={`${msg.session || 'nosession'}-${msg.id || index}`}
                style={[
                  styles.messageBubble,
                  msg.sender === 'bot' ? styles.botBubble : styles.userBubble
                ]}
              >
                <Text style={{ fontWeight: 'bold', marginBottom: 2, color: '#555' }}>
                  [{msg.session}] {(msg.sender || 'unknown').toUpperCase()}
                </Text>
                <Text style={[styles.messageText]}>{msg.text}</Text>
                <Text style={styles.timestamp}>{formatTime(msg.timestamp)}</Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <ScrollView>
            {adminSessions.map((sess, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <TouchableOpacity
                  style={{ flex: 1, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 10 }}
                  onPress={() => loadSession(sess)}
                >
                  <Text>{`${idx + 1}. ${sess}`}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteSession(sess)}
                  style={{ marginLeft: 10, padding: 10, backgroundColor: '#E74C3C', borderRadius: 10 }}
                >
                  <Text style={{ color: '#fff' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 100}
    >
      <View style={{ flex: 1, backgroundColor: terminalMode ? '#000' : '#fff' }}>
        {renderTerminal()}

        {isAdmin && selectedSession && (
          <View style={{ padding: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0' }}>
            <TouchableOpacity onPress={handleBack} style={{ marginRight: 10, padding: 5 }}>
              <Text style={{ color: '#000', fontWeight: 'bold' }}>Back</Text>
            </TouchableOpacity>
            <Text style={{ fontWeight: 'bold', marginRight: 10 }}>Bot Active:</Text>
            <TouchableOpacity
              style={{
                backgroundColor: botActive ? '#2E86DE' : '#ccc',
                padding: 8,
                borderRadius: 10,
                alignItems: 'center',
                minWidth: 60,
              }}
              onPress={() => {
                const botActiveRef = ref(db, 'chatbot/botActive');
                set(botActiveRef, !botActive);
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>{botActive ? 'ON' : 'OFF'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 15, paddingBottom: 150, flexGrow: 1 }}>
          {messages.map(msg => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.sender === 'user'
                  ? styles.userBubble
                  : msg.sender === 'admin'
                  ? styles.adminBubble
                  : styles.botBubble,
              ]}
            >
              <Text style={styles.messageText}>{msg.text}</Text>
              <Text style={styles.timestamp}>{formatTime(msg.timestamp)}</Text>
            </View>
          ))}
        </ScrollView>

        {suggestions.length > 0 && !isAdmin && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsContainer} contentContainerStyle={{ alignItems: 'center' }}>
            {suggestions.map((sugg, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionButton}
                onPress={() => sendMessage(sugg)}
              >
                <Text style={styles.suggestionText}>{sugg}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              { color: terminalMode ? '#0f0' : '#000', backgroundColor: terminalMode ? '#000' : '#f0f0f0' },
            ]}
            placeholder="Type a message..."
            placeholderTextColor={terminalMode ? '#0f0' : '#000'}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendMessage(input)}
          />

          <TouchableOpacity onPress={() => sendMessage(input)} style={styles.sendButton}>
            <Text style={{ color: '#fff' }}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  messageBubble: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  userBubble: { backgroundColor: '#d1f0ff', alignSelf: 'flex-end' },
  botBubble: { backgroundColor: '#f0f0f0', alignSelf: 'flex-start' },
  adminBubble: { backgroundColor: '#f0f0f0', alignSelf: 'flex-start' },
  messageText: { fontSize: 16 },
  timestamp: { fontSize: 10, color: '#555', marginTop: 5, textAlign: 'right' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10, color: 'black', marginTop: -4, marginBottom: -4 },
  sendButton: { backgroundColor: '#2E86DE', padding: 10, borderRadius: 20 },
  suggestionsContainer: { position: 'absolute', bottom: 60, left: 0, right: 0, paddingHorizontal: 10 },
  suggestionButton: { backgroundColor: '#2E86DE', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 5, marginRight: 10 },
  suggestionText: { color: '#fff', fontSize: 14 },
});
