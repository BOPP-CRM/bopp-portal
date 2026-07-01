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
      className={`group block px-6 py-5 cursor-pointer transition-all duration-300 ease-in-out${isCollapsed ? " md:flex md:justify-center md:px-0" : ""}${isActive ? " bg-brown-yellow-5" : ""}`}
    >
      <div
        className={`flex items-center min-w-0${isCollapsed ? " md:justify-center md:min-w-0" : " gap-2"}`}
      >
        <div
          className={`size-6 shrink-0 flex items-center justify-center [&_svg]:shrink-0${isActive ? " text-brown-100" : " text-gray-100 group-hover:text-brown-100"}`}
        >
          {icon}
        </div>
        <span
          className={`text-md min-w-0 flex-1 overflow-hidden whitespace-nowrap opacity-100 transition-all duration-300 ease-in-out${isCollapsed ? " md:w-0 md:flex-none md:opacity-0" : ""}${isActive ? " font-bold text-brown-100" : " text-defualt-text group-hover:text-brown-100"}`}
        >
          {label}
        </span>
      </div>
    </Link>
  );
}
