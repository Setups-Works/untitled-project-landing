import { faBriefcase } from "@fortawesome/free-solid-svg-icons";
import WorkspaceSwitch from "../../../components/app/WorkspaceSwitch";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";

export const metadata = {
  title: "Workspace — untitled project",
  description: "Shared spaces for your team. Coming soon.",
};

export default function WorkspacePage() {
  return (
    <>
      <WorkspaceSwitch />
      <div className="mx-auto flex w-full max-w-[1120px] flex-col items-center gap-3 py-20 text-center">
      <span className="at-green tint grid size-14 place-items-center rounded-full text-[20px]" aria-hidden>
        <FA icon={faBriefcase} />
      </span>
      <h1 className="font-serif text-[clamp(30px,3.4vw,42px)] leading-[1.04] font-normal tracking-[-0.03em] text-balance">Workspace</h1>
      <p className="at-green tint rounded-pill px-3 py-1 text-[12px] font-semibold tracking-[0.1em] uppercase">Coming soon</p>
      <p className="max-w-[420px] text-[14px] text-fg-muted">Shared spaces where your team keeps notes, tasks and chat together. We’re building it now.</p>
      </div>
    </>
  );
}
