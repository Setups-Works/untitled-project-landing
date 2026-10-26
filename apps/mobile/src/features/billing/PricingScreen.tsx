import { formatTokens, priceLine } from "@untitled/logic";
import type { BillingPlan, MyBilling } from "@untitled/types";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DetailBar } from "@/components/ui/DetailBar";
import { Icon } from "@/components/ui/Icon";
import { Screen } from "@/components/ui/Screen";
import { Font, Palette, Radius } from "@/constants/theme";
import { PlanCard } from "./PlanCard";
import { useBilling, useBillingActions } from "./queries";

/** What each plan means for AI, worked out from the plan's own numbers. */
const aiLine = (p: BillingPlan) =>
  p.id === "subscription" ? (p.included_tokens > 0 ? `${formatTokens(p.included_tokens)} tokens a month` : "Included") : p.id === "payg" ? "Billed by use" : "Your own provider";

/** The comparison rows, built from the plans so nothing here is a price or a limit written in code. */
const rows = (plans: BillingPlan[]): { label: string; values: string[] }[] => [
  { label: "Price", values: plans.map(priceLine) },
  { label: "AI", values: plans.map(aiLine) },
  { label: "You pay your AI provider", values: plans.map((p) => (p.id === "byo" ? "Yes" : "No")) },
  { label: "Cancel any time", values: plans.map(() => "Yes") },
];

function Compare({ plans }: { plans: BillingPlan[] }) {
  return (
    <Card style={styles.compare}>
      {rows(plans).map((r) => (
        <View key={r.label} style={styles.compareRow}>
          <AppText variant="bodyStrong">{r.label}</AppText>
          {plans.map((p, i) => (
            <View key={p.id} style={styles.compareCell}>
              <AppText variant="small" color={Palette.fgSubtle} style={styles.planName}>{p.name}</AppText>
              <AppText variant="small" color={Palette.fg} style={styles.value}>{r.values[i]}</AppText>
            </View>
          ))}
        </View>
      ))}
    </Card>
  );
}

/** The app's pricing page: the three plans, how they compare, and a button to choose one. Everything comes from the server's plan list. */
export function PricingScreen() {
  const [err, setErr] = useState("");
  const q = useBilling();
  const { choose } = useBillingActions(setErr);
  const b: MyBilling | undefined = q.data;

  return (
    <Screen>
      <DetailBar label="Plans" onClose={() => router.back()} />
      <View style={styles.hero}>
        <AppText variant="title" accessibilityRole="header">Pick how you pay for AI</AppText>
        <AppText variant="body" color={Palette.fgMuted}>
          Your workspace is one thing; the AI behind it is another. Choose a subscription, pay for what you use, or bring your own key, and change or cancel any time.
        </AppText>
      </View>
      {q.isError ? <Banner kind="error">Couldn’t load the plans. Try again in a moment.</Banner> : null}
      {!b && !q.isError ? <AppText variant="small">Loading plans…</AppText> : null}
      {err ? <Banner kind="error">{err}</Banner> : null}
      {b && !b.payments_connected ? <Banner kind="info">Payments aren’t switched on yet, so choosing a plan doesn’t charge you.</Banner> : null}
      {b?.plans.map((p) => (
        <PlanCard key={p.id} plan={p} current={b.plan?.id === p.id} busy={choose.isPending} loading={choose.isPending && choose.variables === p.id} onChoose={() => choose.mutate(p.id)} />
      ))}
      {b && b.plans.length > 0 ? (
        <>
          <AppText variant="heading">What’s in each plan</AppText>
          <Compare plans={b.plans} />
          <View style={styles.note}>
            <Icon name="check" size={12} color={Palette.greenFg} />
            <AppText variant="small" color={Palette.fgMuted} style={styles.flex}>Notes, tasks, journal, calendar, chat and the Reader are the same on every plan, and AI-free mode is always available.</AppText>
          </View>
          <Button title="Manage my plan in Settings" kind="secondary" onPress={() => router.replace("/profile")} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { gap: 8 },
  compare: { gap: 14 },
  compareRow: { gap: 6 },
  compareCell: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  planName: { flexShrink: 0 },
  value: { flexShrink: 1, textAlign: "right", ...Font.sansMedium },
  note: { flexDirection: "row", gap: 8, alignItems: "flex-start", paddingHorizontal: 4, borderRadius: Radius.r1 },
});
