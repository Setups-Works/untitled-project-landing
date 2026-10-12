import { ICONS } from "../../lib/logos";

const FILE: Record<string, string> = {
  Gmail: "gmail.svg",
  "Google Calendar": "google-calendar.svg",
  "Google Meet": "google-meet.svg",
  "Google Drive": "google-drive.svg",
  "Google Sheets": "google-sheets.svg",
  Maps: "maps.svg",
  Outlook: "outlook.svg",
  "Microsoft Teams": "microsoft-teams.svg",
  Slack: "slack.svg",
  Zoom: "zoom.svg",
  Notion: "notion.svg",
  GitHub: "github.svg",
  Linear: "linear.svg",
  Cloudflare: "cloudflare.svg",
  Eventbrite: "eventbrite.png",
};

/** A service's logo: an image from /public/logos, an inline brand mark, or its initial. */
export function Logo({ name, size = 24 }: { name: string; size?: number }) {
  const f = FILE[name];
  if (f)
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={`/logos/${f}`}
        alt=""
        width={size}
        height={size}
        className={`shrink-0 object-contain ${f.endsWith(".png") ? "rounded-[6px]" : ""}`}
      />
    );
  const ic = ICONS[name];
  if (ic)
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={ic.hex} aria-hidden className="shrink-0">
        <path d={ic.path} />
      </svg>
    );
  return <span className="font-semibold">{name[0]}</span>;
}
