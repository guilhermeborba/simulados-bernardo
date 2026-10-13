import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, type Href } from "expo-router";
import { useSession } from "./session-context";
import { years } from "./data";
export const colors = {
  ink: "#18213B",
  muted: "#56617C",
  purple: "#5933B0",
  pale: "#F1EBFF",
  background: "#F6F7FC",
  teal: "#166C63",
  line: "#D7DAE6",
};
export function Copy({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <Text style={[styles.copy, muted && { color: colors.muted }]}>
      {children}
    </Text>
  );
}
export function Button({
  title,
  onPress,
  disabled = false,
  secondary = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        (disabled || pressed) && { opacity: 0.6 },
      ]}
    >
      <Text style={[styles.buttonText, secondary && { color: colors.purple }]}>
        {title}
      </Text>
    </Pressable>
  );
}
export function Card({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      {title && <Text style={styles.cardTitle}>{title}</Text>}
      {children}
    </View>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        style={styles.input}
        {...props}
      />
    </View>
  );
}
export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.notice}>
      <Copy>{children}</Copy>
    </View>
  );
}
export function Loading() {
  return (
    <View style={{ padding: 24, gap: 12 }}>
      <ActivityIndicator size="large" color={colors.purple} />
      <Copy>Carregando sua jornada…</Copy>
    </View>
  );
}
export function Screen({
  title,
  subtitle,
  children,
  student = false,
  publicScreen = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  student?: boolean;
  publicScreen?: boolean;
}) {
  const { session, cleanupError, cleanupMedia } = useSession();
  const authenticated = session.status === "authenticated" && session.user;
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["left", "right", "bottom"]}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.page}
      >
        <Text accessibilityRole="header" style={styles.heading}>
          {title}
        </Text>
        {subtitle && <Copy muted>{subtitle}</Copy>}
        {cleanupError && (
          <Notice>
            {cleanupError}
            <Button
              title="Tentar limpeza"
              secondary
              onPress={() => {
                void cleanupMedia();
              }}
            />
          </Notice>
        )}
        {!publicScreen && !authenticated ? (
          <Card title="Entre para continuar">
            <Button
              title="Ir para o acesso"
              onPress={() => router.replace("/")}
            />
          </Card>
        ) : student && session.user?.role !== "STUDENT" ? (
          <Card title="Acompanhe seus alunos">
            <Button
              title="Abrir acompanhamento"
              onPress={() => router.replace("/oversight")}
            />
          </Card>
        ) : (
          children
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
export function Navigation() {
  const { session } = useSession();
  const entries =
    session.user?.role === "STUDENT"
      ? [
          ["Hoje", "/"],
          ["Quizzes", "/quizzes"],
          ["Progresso", "/progress"],
          ["Perfil", "/profile"],
        ]
      : [
          ["Alunos", "/oversight"],
          ["Perfil", "/profile"],
        ];
  return (
    <View style={styles.nav}>
      {entries.map(([title, href]) => (
        <Pressable
          accessibilityRole="link"
          key={href}
          onPress={() => router.push(href as Href)}
          style={styles.navLink}
        >
          <Text style={styles.navText}>{title}</Text>
        </Pressable>
      ))}
    </View>
  );
}
export function YearPicker({
  year,
  onChange,
}: {
  year: number | null;
  onChange: (year: number) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
    >
      {years.map((item) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={item.label}
          accessibilityState={{ selected: item.value === year }}
          key={item.value}
          onPress={() => onChange(item.value)}
          style={[
            styles.pill,
            item.value === year && { backgroundColor: colors.purple },
          ]}
        >
          <Text
            style={{
              color: item.value === year ? "#FFF" : colors.ink,
              fontWeight: "700",
            }}
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
export const styles = StyleSheet.create({
  page: {
    padding: 22,
    gap: 18,
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
    paddingBottom: 40,
  },
  heading: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -1,
  },
  copy: { fontSize: 16, color: colors.ink, lineHeight: 24 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E7E8F2",
    padding: 20,
    gap: 12,
  },
  cardTitle: { fontSize: 21, fontWeight: "800", color: colors.ink },
  button: {
    backgroundColor: colors.purple,
    borderRadius: 16,
    padding: 15,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  secondary: { backgroundColor: colors.pale },
  label: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  input: {
    backgroundColor: "#FFF",
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 17,
    color: colors.ink,
    minHeight: 52,
  },
  notice: { backgroundColor: "#E9F3F0", borderRadius: 16, padding: 16 },
  nav: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#FFF",
    borderRadius: 16,
  },
  navLink: {
    flexGrow: 1,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  navText: { color: colors.purple, fontWeight: "800", fontSize: 15 },
  pill: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    minHeight: 44,
  },
});
