"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import type { Prefs } from "../../lib/prefs";
import SettingsView from "./SettingsView";

type Account = {
  name: string;
  email: string;
  hasPassword: boolean;
  providers: string[];
  createdAt: string;
  avatarUrl: string | null;
  lastSignIn: string | null;
};

/** The Settings popup. Radix Dialog handles the focus trap, Escape (including when a confirm dialog is stacked on top), scroll lock and focus restore. */
export default function SettingsModal({ account, prefs, onClose }: { account: Account; prefs: Prefs; onClose: () => void }) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="sm-back">
          <Dialog.Content className="sm" aria-describedby={undefined}>
            <div className="sm-head">
              <Dialog.Title className="h3">Settings</Dialog.Title>
              <Dialog.Close asChild>
                <button className="ne-btn" aria-label="Close settings">
                  <FA icon={faXmark} />
                </button>
              </Dialog.Close>
            </div>
            <div className="sm-body">
              <SettingsView account={account} prefs={prefs} />
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
