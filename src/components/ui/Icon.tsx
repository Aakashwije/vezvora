import {
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CircleCheck,
  Clock,
  Cog,
  Cpu,
  Globe,
  Mail,
  MapPin,
  Network,
  Phone,
  RefreshCw,
  Rocket,
  Shield,
  Smartphone,
  Store,
  TrendingUp,
  Wallet,
  Zap,
  // Admin console
  LayoutDashboard,
  Inbox,
  Settings,
  Users,
  LogOut,
  Search,
  ListFilter,
  Download,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronRight,
  ChevronDown,
  EllipsisVertical,
  MessageCircle,
  Star,
  GripVertical,
  ExternalLink,
  Calendar,
  Eye,
  FolderKanban,
  Tag,
  Layers,
  Briefcase,
  FileText,
  CircleDollarSign,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

/**
 * Central icon registry. Design data references icons by name (mirroring the
 * source designs); this maps those names to a single, tree-shakeable icon set
 * so no runtime icon-font is loaded.
 */
export const iconMap = {
  arrow_forward: ArrowRight,
  arrow_upward: ArrowUp,
  arrow_outward: ArrowUpRight,
  verified: BadgeCheck,
  architecture: Building2,
  check_circle: CircleCheck,
  schedule: Clock,
  precision_manufacturing: Cog,
  memory: Cpu,
  language: Globe,
  mail: Mail,
  location_on: MapPin,
  hub: Network,
  call: Phone,
  sync: RefreshCw,
  rocket_launch: Rocket,
  shield: Shield,
  smartphone: Smartphone,
  point_of_sale: Store,
  insights: TrendingUp,
  account_balance_wallet: Wallet,
  bolt: Zap,
  // Admin console
  dashboard: LayoutDashboard,
  inbox: Inbox,
  settings: Settings,
  users: Users,
  logout: LogOut,
  search: Search,
  filter: ListFilter,
  download: Download,
  add: Plus,
  edit: Pencil,
  delete: Trash2,
  close: X,
  chevron_right: ChevronRight,
  chevron_down: ChevronDown,
  more: EllipsisVertical,
  message: MessageCircle,
  star: Star,
  drag: GripVertical,
  external: ExternalLink,
  calendar: Calendar,
  eye: Eye,
  folder: FolderKanban,
  tag: Tag,
  layers: Layers,
  briefcase: Briefcase,
  file: FileText,
  dollar: CircleDollarSign,
  person_add: UserPlus,
  trending_up: TrendingUp,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof iconMap;

type IconProps = {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  "aria-hidden"?: boolean;
};

export function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  className,
  "aria-hidden": ariaHidden = true,
}: IconProps) {
  const Glyph = iconMap[name];
  return (
    <Glyph
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden={ariaHidden}
    />
  );
}
