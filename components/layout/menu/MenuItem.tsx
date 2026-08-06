import Link from "next/link";

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  isActive?: boolean;
  isCollapsed?: boolean;
  onClick?: () => void;
}

export default function MenuItem({
  icon,
  label,
  path,
  isActive = false,
  isCollapsed = false,
  onClick,
}: MenuItemProps) {
  return (
    <Link
      href={path}
      prefetch={false}
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      className={`group block cursor-pointer px-3 py-2 transition-colors duration-200${isCollapsed ? " md:flex md:justify-center md:px-0" : " mx-2 rounded-xl"}${isActive ? " bg-brown-yellow-5" : " hover:bg-gray-10"}`}
    >
      <div
        className={`flex min-w-0 items-center${isCollapsed ? " md:justify-center md:min-w-0" : " gap-2.5"}`}
      >
        <div
          className={`flex size-4 shrink-0 items-center justify-center [&_svg]:size-4 [&_svg]:shrink-0${isActive ? " text-brown-100" : " text-gray-100 group-hover:text-brown-100"}`}
        >
          {icon}
        </div>
        <span
          className={`min-w-0 flex-1 overflow-hidden text-sm whitespace-nowrap opacity-100 transition-all duration-300 ease-in-out${isCollapsed ? " md:w-0 md:flex-none md:opacity-0" : ""}${isActive ? " font-semibold text-brown-100" : " text-defualt-text group-hover:text-brown-100"}`}
        >
          {label}
        </span>
      </div>
    </Link>
  );
}
