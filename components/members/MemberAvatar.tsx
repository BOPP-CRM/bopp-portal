"use client";

import { useState } from "react";

type MemberAvatarProps = {
  name: string;
  pictureUrl?: string | false | null;
  size?: "sm" | "md" | "lg";
};

const SIZE_CLASS = {
  sm: "size-10 text-xs",
  md: "size-14 text-lg",
  lg: "size-16 text-lg",
} as const;

export default function MemberAvatar({
  name,
  pictureUrl,
  size = "sm",
}: MemberAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const sizeClass = SIZE_CLASS[size];
  const showImage = Boolean(pictureUrl) && !imageError;

  if (showImage) {
    return (
      <img
        src={String(pictureUrl)}
        alt={name}
        onError={() => setImageError(true)}
        className={`${sizeClass} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-brown-100 font-medium text-white ${sizeClass}`}
      aria-hidden
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </div>
  );
}
