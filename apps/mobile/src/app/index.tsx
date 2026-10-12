import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { mobileEnv } from '@/config/env';
import { Colors, NativeTokens, Spacing } from '@/constants/theme';
import type { MobileTask, TaskListResponse, TaskResponse } from '@/features/tasks/types';
import { createMobileAuthClient } from '@/lib/auth-client';
import { createApiClient } from '@untitled/api-client';

const palette = Colors.light;

export default function HomeScreen() {
  if (!mobileEnv.apiBaseUrl) return <SetupScreen />;
  return <SignedInHome />;
}

function SetupScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>untitled project</Text>
        <Text style={styles.title}>Connect your workspace</Text>
        <Text style={styles.copy}>
          Add the web app address to apps/mobile/.env.local. Use your computer’s LAN address when running on a physical device.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function SignedInHome() {
  const [auth] = useState(createMobileAuthClient);
  const [api] = useState(() =>
    createApiClient({
      baseUrl: mobileEnv.apiBaseUrl ?? '',
      credentials: 'omit',
      getHeaders: async (): Promise<Record<string, string>> => {
        const cookie = await auth.getCookie();
        return cookie ? { Cookie: cookie } : {};
      },
    }),
  );
  const { data: session, isPending: sessionPending } = auth.useSession();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [draft, setDraft] = useState('');
  const [tasks, setTasks] = useState<MobileTask[]>([]);
  const [notice, setNotice] = useState('');

  const loadTasks = useCallback(async () => {
    const response = await api.request<TaskListResponse>('/api/v1/tasks?limit=50');
    if (!response.ok) {
      setNotice(response.error.message);
      return;
    }
    setTasks(response.data.data);
    setNotice('');
  }, [api]);

  useEffect(() => {
    if (!session?.user.id) return;
    let active = true;
    void api.request<TaskListResponse>('/api/v1/tasks?limit=50').then((response) => {
      if (!active) return;
      if (!response.ok) setNotice(response.error.message);
      else {
        setTasks(response.data.data);
        setNotice('');
      }
    });
    return () => {
      active = false;
    };
  }, [api, session?.user.id]);

  async function submitAuth() {
    setIsBusy(true);
    setNotice('');
    try {
      const result = isSigningUp
        ? await auth.signUp.email({ name: name.trim(), email: email.trim(), password })
        : await auth.signIn.email({ email: email.trim(), password });
      if (result.error) setNotice(result.error.message ?? 'Sign-in failed. Please try again.');
      else if (isSigningUp) setNotice('Check your email to verify your account, then sign in.');
      else setTasks([]);
    } catch {
      setNotice('Couldn’t connect. Check the web app address and try again.');
    } finally {
      setIsBusy(false);
    }
  }

  async function addTask() {
    const title = draft.trim();
    if (!title) return;
    setIsBusy(true);
    const response = await api.request<TaskResponse>('/api/v1/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (response.ok) {
      setDraft('');
      await loadTasks();
    } else setNotice(response.error.message);
    setIsBusy(false);
  }

  async function toggleTask(task: MobileTask) {
    const response = await api.request<TaskResponse>(`/api/v1/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ done: !task.done }),
    });
    if (response.ok) await loadTasks();
    else setNotice(response.error.message);
  }

  if (sessionPending) {
    return (
      <SafeAreaView style={styles.screen}>
        <ActivityIndicator color={NativeTokens.green} accessibilityLabel="Loading your session" />
      </SafeAreaView>
    );
  }

  if (!session?.user) {
    return (
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Text style={styles.eyebrow}>untitled project</Text>
          <Text style={styles.title}>{isSigningUp ? 'Create your account' : 'A little space to think'}</Text>
          <Text style={styles.copy}>Sign in to your workspace and pick up where you left off.</Text>
          {isSigningUp && (
            <TextInput
              accessibilityLabel="Name"
              autoCapitalize="words"
              onChangeText={setName}
              placeholder="Name"
              style={styles.input}
              value={name}
            />
          )}
          <TextInput
            accessibilityLabel="Email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Email"
            style={styles.input}
            value={email}
          />
          <TextInput
            accessibilityLabel="Password"
            autoComplete={isSigningUp ? 'new-password' : 'current-password'}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            style={styles.input}
            value={password}
          />
          {notice ? <Text accessibilityRole="alert" style={styles.notice}>{notice}</Text> : null}
          <Pressable accessibilityRole="button" disabled={isBusy} onPress={submitAuth} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{isBusy ? 'Please wait…' : isSigningUp ? 'Create account' : 'Sign in'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setNotice('');
              setIsSigningUp((current) => !current);
            }}
            style={styles.textButton}>
            <Text style={styles.textButtonText}>{isSigningUp ? 'I already have an account' : 'Create an account'}</Text>
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>your workspace</Text>
            <Text style={styles.title}>To-do</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setTasks([]);
              void auth.signOut();
            }}
            style={styles.textButton}>
            <Text style={styles.textButtonText}>Sign out</Text>
          </Pressable>
        </View>
        <Text style={styles.copy}>A clear next step is enough.</Text>
        <View style={styles.addRow}>
          <TextInput
            accessibilityLabel="New to-do"
            onChangeText={setDraft}
            onSubmitEditing={() => void addTask()}
            placeholder="Add a to-do"
            returnKeyType="done"
            style={[styles.input, styles.taskInput]}
            value={draft}
          />
          <Pressable accessibilityRole="button" disabled={isBusy || !draft.trim()} onPress={addTask} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>
        {notice ? <Text accessibilityRole="alert" style={styles.notice}>{notice}</Text> : null}
        {tasks.length === 0 ? (
          <Text style={styles.empty}>Nothing here yet. Add a to-do to get started.</Text>
        ) : (
          <View style={styles.taskList}>
            {tasks.map((task) => (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: task.done }}
                key={task.id}
                onPress={() => void toggleTask(task)}
                style={styles.taskRow}>
                <View style={[styles.check, task.done && styles.checked]} />
                <Text style={[styles.taskTitle, task.done && styles.completed]}>{task.title}</Text>
              </Pressable>
            ))}
          </View>
        )}
        <Pressable accessibilityRole="button" onPress={() => void loadTasks()} style={styles.textButton}>
          <Text style={styles.textButtonText}>Refresh</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { width: '100%', maxWidth: 640, alignSelf: 'center', flexGrow: 1, justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  eyebrow: { color: NativeTokens.green, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase' },
    title: { color: palette.text, fontSize: 36, lineHeight: 42 },
  copy: { color: palette.textSecondary, fontSize: 16, lineHeight: 24 },
  input: { backgroundColor: palette.backgroundElement, borderRadius: 14, color: palette.text, fontSize: 16, minHeight: 48, paddingHorizontal: 16 },
  notice: { color: NativeTokens.clay, fontSize: 14, lineHeight: 20 },
  primaryButton: { alignItems: 'center', backgroundColor: NativeTokens.darkFill, borderRadius: 24, justifyContent: 'center', minHeight: 48, paddingHorizontal: 20 },
  primaryButtonText: { color: NativeTokens.onDark, fontSize: 15, fontWeight: '600' },
  textButton: { alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center' },
  textButtonText: { color: NativeTokens.green, fontSize: 14, fontWeight: '600' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  addRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.two },
  taskInput: { flex: 1 },
  addButton: { alignItems: 'center', backgroundColor: NativeTokens.darkFill, borderRadius: 24, justifyContent: 'center', minHeight: 48, minWidth: 64, paddingHorizontal: 16 },
  addButtonText: { color: NativeTokens.onDark, fontSize: 14, fontWeight: '600' },
  taskList: { backgroundColor: palette.backgroundElement, borderRadius: 20, paddingHorizontal: 16 },
  taskRow: { alignItems: 'center', borderBottomColor: NativeTokens.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12, minHeight: 54 },
  check: { borderColor: NativeTokens.outline, borderRadius: 10, borderWidth: 1, height: 20, width: 20 },
  checked: { backgroundColor: NativeTokens.green, borderColor: NativeTokens.green },
  taskTitle: { color: palette.text, flex: 1, fontSize: 15 },
  completed: { color: palette.textSecondary, textDecorationLine: 'line-through' },
  empty: { color: palette.textSecondary, fontSize: 14, paddingVertical: Spacing.three },
});
