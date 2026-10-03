import type { Metadata } from "next";
import NotFoundFun from "../components/NotFoundFun";

export const metadata: Metadata = { title: "404 — untitled project (it’s not us)", robots: { index: false } };

export default function NotFound() {
  return <NotFoundFun />;
}
