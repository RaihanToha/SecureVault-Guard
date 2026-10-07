import React from "react";
import { User } from "lucide-react";

interface UserAvatarProps {
  avatar?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showStatus?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-20 h-20 text-2xl",
  "2xl": "w-24 h-24 text-3xl",
};

const iconSizes = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-7 h-7",
  xl: "w-10 h-10",
  "2xl": "w-12 h-12",
};

export function UserAvatar({
  avatar,
  name = "User",
  size = "md",
  className = "",
  showStatus = false,
}: UserAvatarProps) {
  const getInitials = (str: string) => {
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name);
  const sizeClass = sizeClasses[size];

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className={`${sizeClass} rounded-full object-cover border-2 border-white shadow-sm ring-2 ring-blue-500/20`}
        />
      ) : (
        <div
          className={`${sizeClass} rounded-full bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 text-white font-bold flex items-center justify-center border-2 border-white shadow-sm ring-2 ring-blue-500/20 select-none tracking-wider`}
        >
          {initials || <User className={iconSizes[size]} />}
        </div>
      )}

      {showStatus && (
        <span
          className="absolute bottom-0 right-0 block w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
          title="Online"
        />
      )}
    </div>
  );
}

export default UserAvatar;
