import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { INVITE_ROLES, ROLE_HELP, ROLE_LABEL } from "@untitled/logic";
import type { SharedJournalInviteRole } from "../types";

/** Editor or viewer, as a form pill (a native select, so it works with every keyboard and screen reader). */
export default function RoleSelect({
  value,
  onChange,
  label,
  disabled,
}: {
  value: SharedJournalInviteRole;
  onChange: (role: SharedJournalInviteRole) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className="tf-pill" title={ROLE_HELP[value]}>
      <select value={value} disabled={disabled} aria-label={label} onChange={(e) => onChange(e.target.value as SharedJournalInviteRole)}>
        {INVITE_ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABEL[r]}
          </option>
        ))}
      </select>
      <FA icon={faChevronDown} aria-hidden className="text-[11px]" />
    </label>
  );
}
