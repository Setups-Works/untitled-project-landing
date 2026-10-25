import { useState } from "react";

import { useRssActions } from "./queries";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { TextField } from "@/components/ui/TextField";
import { errorMessage } from "@/lib/api";

/** Asks for a feed or website address. Stays open with the reason when the address can't be followed. */
export function AddFeedSheet({ visible, onClose, onAdded }: { visible: boolean; onClose: () => void; onAdded: (feedId: string) => void }) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Add a feed">
      {visible ? <Form onClose={onClose} onAdded={onAdded} /> : null}
    </Sheet>
  );
}

function Form({ onClose, onAdded }: { onClose: () => void; onAdded: (feedId: string) => void }) {
  const { add } = useRssActions();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!url.trim() || add.isPending) return;
    setError(null);
    add.mutate(url.trim(), {
      onSuccess: (feed) => {
        onAdded(feed.id);
        onClose();
      },
      onError: (e) => setError(errorMessage(e)),
    });
  };

  return (
    <>
      <TextField
        label="Feed or website address"
        value={url}
        onChangeText={setUrl}
        error={error}
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        placeholder="example.com/feed.xml"
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      <Button title="Add feed" loading={add.isPending} disabled={!url.trim()} onPress={submit} style={{ marginTop: 14 }} />
    </>
  );
}
