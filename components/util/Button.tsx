import type { ButtonVariant } from "./dialog";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brown-100 text-white hover:bg-brown-100/80",
  tertiary: "bg-gray-10 text-gray-100 hover:bg-gray-10/80",
  danger: "bg-red-100 text-white hover:bg-red-100/80",
  outlined:
    "border border-gray-50 text-defualt-text bg-white hover:bg-gray-50/10",
};

interface ButtonProps {
  variant?: ButtonVariant;
  text: string;
  onClick?: () => void;
}

export default function Button({
  variant = "primary",
  text = "",
  onClick,
}: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full py-2 rounded-4xl cursor-pointer px-4 ${variants[variant as ButtonVariant]}`}
    >
      {text}
    </button>
  );
}
