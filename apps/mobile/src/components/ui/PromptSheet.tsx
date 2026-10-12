import { useState } from "react";

import { Button } from "./Button";
import { Sheet } from "./Sheet";
import { TextField } from "./TextField";

/** A one-field prompt in a sheet (the app never uses native `prompt`). The field starts from `initial` each time it opens. */
export function PromptSheet({
  visible,
  title,
  label,
  initial = "",
  cta = "Save",
  onSubmit,
  onClose,
}: {
  visible: boolean;
  title: string;
  label: string;
  initial?: string;
  cta?: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      {visible ? <Form label={label} initial={initial} cta={cta} onSubmit={onSubmit} /> : null}
    </Sheet>
  );
}

function Form({ label, initial, cta, onSubmit }: { label: string; initial: string; cta: string; onSubmit: (v: string) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <TextField
        label={label}
        value={value}
        onChangeText={setValue}
        autoFocus
        maxLength={80}
        returnKeyType="done"
        onSubmitEditing={() => value.trim() && onSubmit(value.trim())}
      />
      <Button title={cta} disabled={!value.trim()} onPress={() => onSubmit(value.trim())} style={{ marginTop: 14 }} />
    </>
  );
}
