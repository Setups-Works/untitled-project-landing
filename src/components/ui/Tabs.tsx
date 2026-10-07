"use client";
import * as RadixTabs from "@radix-ui/react-tabs";
import type { ComponentPropsWithoutRef } from "react";

/**
 * Tabs on Radix Tabs: roving tabindex, ←/→ (or ↑/↓ when `orientation="vertical"`) and Home/End navigation,
 * correct `role="tablist" | "tab" | "tabpanel"` and `aria-selected` / `aria-controls` wiring.
 *
 *   <Tabs value={tab} onValueChange={setTab}>
 *     <TabsList className="my-list" aria-label="Show chats">
 *       <TabsTrigger value="all">All</TabsTrigger>
 *       <TabsTrigger value="unread">Unread</TabsTrigger>
 *     </TabsList>
 *   </Tabs>
 *
 * Panels are optional (some tab strips only switch a filter). Use `<TabsContent forceMount>` to keep an inactive
 * panel mounted (its state survives) — Radix then hides it with the `hidden` attribute.
 * Style with the `aria-selected="true"` / `data-state="active"` attributes.
 */
export const Tabs = RadixTabs.Root;
export const TabsList = (p: ComponentPropsWithoutRef<typeof RadixTabs.List>) => <RadixTabs.List {...p} />;
export const TabsTrigger = (p: ComponentPropsWithoutRef<typeof RadixTabs.Trigger>) => <RadixTabs.Trigger {...p} />;
export const TabsContent = (p: ComponentPropsWithoutRef<typeof RadixTabs.Content>) => <RadixTabs.Content {...p} />;
