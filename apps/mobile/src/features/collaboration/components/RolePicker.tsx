import { INVITE_ROLES, ROLE_HELP, ROLE_LABEL } from "@untitled/logic";
import type { SharedJournalInviteRole } from "@untitled/types";
import { View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Segmented } from "@/components/ui/Segmented";

/** Editor or viewer, with a line saying what the chosen role can do. */
export function RolePicker({ value, onChange }: { value: SharedJournalInviteRole; onChange: (role: SharedJournalInviteRole) => void }) {
  return (
    <View>
      <Segmented options={INVITE_ROLES.map((r) => ({ key: r, label: ROLE_LABEL[r] }))} value={value} onChange={onChange} />
      <AppText variant="small">{ROLE_HELP[value]}</AppText>
    </View>
  );
}
