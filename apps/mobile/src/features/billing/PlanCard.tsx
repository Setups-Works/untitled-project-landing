import { formatTokens, priceLine } from "@untitled/logic";
import type { BillingPlan } from "@untitled/types";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Palette, Radius } from "@/constants/theme";

/** One plan as the server describes it: name, price, what it includes and a button to choose it. Shared by Settings and the pricing screen. */
export function PlanCard({
  plan,
  current,
  busy,
  loading,
  onChoose,
}: {
  plan: BillingPlan;
  current: boolean;
  busy: boolean;
  loading: boolean;
  onChoose: () => void;
}) {
  return (
    <View style={[styles.plan, current ? styles.planCurrent : null]}>
      <View style={styles.head}>
        <AppText variant="bodyStrong">{plan.name}</AppText>
        {current ? <AppText variant="label" color={Palette.greenFg}>Current</AppText> : null}
      </View>
      <AppText variant="heading">{priceLine(plan)}</AppText>
      <AppText variant="small" color={Palette.fgMuted}>{plan.tagline}</AppText>
      {plan.id === "subscription" && plan.included_tokens > 0 ? (
        <AppText variant="small" color={Palette.fgSubtle}>{formatTokens(plan.included_tokens)} AI tokens included each month</AppText>
      ) : null}
      {plan.features.map((f) => (
        <View key={f} style={styles.feature}>
          <Icon name="check" size={12} color={Palette.greenFg} />
          <AppText variant="small" style={styles.flex}>{f}</AppText>
        </View>
      ))}
      <Button title={current ? "Your plan" : "Choose this plan"} kind={current ? "secondary" : "primary"} disabled={current || busy} loading={loading} onPress={onChoose} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  plan: { gap: 8, padding: 14, borderRadius: Radius.r3, borderWidth: 1, borderColor: Palette.line, backgroundColor: Palette.glassHi },
  planCurrent: { borderColor: Palette.greenFg },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  feature: { flexDirection: "row", alignItems: "center", gap: 8 },
});
