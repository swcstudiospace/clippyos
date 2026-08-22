import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  CalendarDays,
  Clapperboard,
  CreditCard,
  Image,
  LayoutDashboard,
  Lightbulb,
  MessageCircle,
  Settings,
  ShieldCheck,
  Share2,
  Target,
  UserCog,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { to: "/home", label: "Dashboard", icon: LayoutDashboard },
  { to: "/money", label: "Money", icon: Wallet },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/leads", label: "Leads", icon: Target },
  { to: "/ideation", label: "Ideation", icon: Lightbulb },
  { to: "/agent", label: "Agent", icon: Bot },
  { to: "/thumbnails", label: "Thumbnails", icon: Image },
  { to: "/library", label: "Library", icon: Clapperboard },
  { to: "/social", label: "Social", icon: Share2 },
  { to: "/inbox", label: "Inbox", icon: MessageCircle },
  { to: "/approvals", label: "Approvals", icon: ShieldCheck },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/team", label: "Team", icon: UserCog },
  { to: "/onboarding", label: "Onboarding", icon: UserPlus },
  { to: "/billing", label: "Billing", icon: CreditCard },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;