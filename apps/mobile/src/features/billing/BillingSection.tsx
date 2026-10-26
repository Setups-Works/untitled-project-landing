import { BYO_PROVIDERS, byoProvider, formatMoney, formatTokens, priceLine } from "@untitled/logic";
import type { MyBilling } from "@untitled/types";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useConfirm } from "@/components/ui/Confirm";
import { Icon } from "@/components/ui/Icon";
import { PickerField } from "@/components/ui/PickerField";
import { TextField } from "@/components/ui/TextField";
import { Palette, Radius } from "@/constants/theme";
import { useBilling, useBillingActions } from "./queries";

const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });

/** One line about where the current plan stands: when it renews or ends, or what this period has used. */
function standing(b: MyBilling): string {
  if (!b.plan) return b.status === "canceled" ? "Your last plan has ended. Choose a plan below to start again." : "You haven’t chosen a plan yet. AI works as it always has until you do.";
  if (b.plan.id === "subscription" && b.period_end)
    return b.cancel_at_period_end ? `Cancels on ${day(b.period_end)}. You keep everything until then.` : `Renews on ${day(b.period_end)}.`;
  if (b.plan.id === "payg") return `${formatTokens(b.tokens_used)} tokens used this period${b.cost_cents > 0 ? `, about ${formatMoney(b.cost_cents, b.plan.currency)}` : ""}.`;
  return b.byo.hint ? "Your own key is saved." : "Add your API key to start using AI.";
}

function KeyForm({ billing, onError }: { billing: MyBilling; onError: (m: string) => void }) {
  const { saveKey, removeKey } = useBillingActions(onError);
  const { ask, dialog } = useConfirm();
  const [provider, setProvider] = useState<string>(billing.byo.provider ?? BYO_PROVIDERS[0].id);
  const [model, setModel] = useState(billing.byo.model ?? BYO_PROVIDERS[0].model);
  const [apiKey, setApiKey] = useState("");
  const saved = billing.byo.hint;

  return (
    <View style={styles.key}>
      {dialog}
      <AppText variant="bodyStrong">Your AI provider</AppText>
      <PickerField
        label="Provider"
        value={provider}
        options={BYO_PROVIDERS.map((p) => ({ value: p.id, label: p.label }))}
        onChange={(id) => {
          setProvider(id);
          setModel(byoProvider(id)?.model ?? model);
        }}
      />
      <TextField label="Model" value={model} onChangeText={setModel} autoCapitalize="none" autoCorrect={false} maxLength={100} />
      <TextField
        label={saved ? `API key (saved, ending ${saved})` : "API key"}
        value={apiKey}
        onChangeText={setApiKey}
        password
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={saved ? "Enter a new key to replace it" : "Paste your key"}
      />
      <AppText variant="small" color={Palette.fgSubtle}>Your key is stored encrypted and only used to answer your own requests. It is never shown again.</AppText>
      <Button
        title={saved ? "Replace key" : "Save key"}
        loading={saveKey.isPending}
        disabled={!apiKey.trim() || !model.trim()}
        onPress={() => saveKey.mutate({ provider, model: model.trim(), apiKey: apiKey.trim() }, { onSuccess: () => setApiKey("") })}
      />
      {saved ? (
        <Button
          title="Remove key"
          kind="secondary"
          onPress={async () => {
            if (await ask({ title: "Remove your API key?", body: "AI stops working on this plan until you add a key again.", confirmLabel: "Remove key", danger: true })) removeKey.mutate();
          }}
        />
      ) : null}
    </View>
  );
}

/** Settings → Plan and billing: where you stand, the plans on offer, your own key, and cancelling. */
export function BillingSection() {
  const [err, setErr] = useState("");
  const q = useBilling();
  const { choose, cancel, resume } = useBillingActions(setErr);
  const { ask, dialog } = useConfirm();
  const b = q.data;
  const busy = choose.isPending || cancel.isPending || resume.isPending;

  return (
    <Card tone="green" style={styles.card}>
      {dialog}
      <AppText variant="heading" accessibilityRole="header">Plan and billing</AppText>
      {q.isError ? <Banner kind="error">Couldn’t load your plan. Try again in a moment.</Banner> : null}
      {!b && !q.isError ? <AppText variant="small">Loading your plan…</AppText> : null}
      {err ? <Banner kind="error">{err}</Banner> : null}
      {b ? (
        <>
          <View>
            <AppText variant="bodyStrong">{b.plan ? b.plan.name : "No plan chosen"}</AppText>
            <AppText variant="small" color={Palette.fgMuted}>{standing(b)}</AppText>
            {b.plan?.id === "subscription" && b.plan.included_tokens > 0 ? (
              <AppText variant="small" color={Palette.fgSubtle}>{formatTokens(b.tokens_used)} of {formatTokens(b.plan.included_tokens)} tokens used this period</AppText>
            ) : null}
          </View>
          {!b.payments_connected ? <Banner kind="info">Payments aren’t connected yet, so choosing or changing a plan doesn’t charge you.</Banner> : null}

          {b.plans.map((p) => {
            const current = b.plan?.id === p.id;
            return (
              <View key={p.id} style={[styles.plan, current ? styles.planCurrent : null]}>
                <View style={styles.planHead}>
                  <AppText variant="bodyStrong">{p.name}</AppText>
                  {current ? <AppText variant="label" color={Palette.greenFg}>Current</AppText> : null}
                </View>
                <AppText variant="heading">{priceLine(p)}</AppText>
                <AppText variant="small" color={Palette.fgMuted}>{p.tagline}</AppText>
                {p.id === "subscription" && p.included_tokens > 0 ? <AppText variant="small" color={Palette.fgSubtle}>{formatTokens(p.included_tokens)} AI tokens included each month</AppText> : null}
                {p.features.map((f) => (
                  <View key={f} style={styles.feature}>
                    <Icon name="check" size={12} color={Palette.greenFg} />
                    <AppText variant="small" style={styles.flex}>{f}</AppText>
                  </View>
                ))}
                <Button title={current ? "Your plan" : "Choose this plan"} kind={current ? "secondary" : "primary"} disabled={current || busy} loading={choose.isPending && choose.variables === p.id} onPress={() => choose.mutate(p.id)} />
              </View>
            );
          })}

          {b.plan?.id === "byo" ? <KeyForm billing={b} onError={setErr} /> : null}

          {b.plan ? (
            b.cancel_at_period_end ? (
              <Button title="Keep my plan" kind="secondary" disabled={busy} onPress={() => resume.mutate()} />
            ) : (
              <Button
                title="Cancel plan"
                kind="secondary"
                disabled={busy}
                onPress={async () => {
                  const ends = b.plan?.id === "subscription" && b.period_end ? `It ends on ${day(b.period_end)}.` : "It stops right away.";
                  if (await ask({ title: `Cancel ${b.plan?.name}?`, body: `${ends} You can choose a plan again whenever you like.`, confirmLabel: "Cancel plan", danger: true })) cancel.mutate();
                }}
              />
            )
          ) : null}
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  flex: { flex: 1 },
  plan: { gap: 8, padding: 14, borderRadius: Radius.r3, borderWidth: 1, borderColor: Palette.line, backgroundColor: Palette.glassHi },
  planCurrent: { borderColor: Palette.greenFg },
  planHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  feature: { flexDirection: "row", alignItems: "center", gap: 8 },
  key: { gap: 12, padding: 14, borderRadius: Radius.r3, backgroundColor: Palette.surfaceMuted },
});
