// src/forumManagement/utils/colorUtils.ts
export const generateColorFromString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash % 360);
  const saturation = 65 + (Math.abs(hash) % 20);
  const lightness = 50 + (Math.abs(hash >> 8) % 15);

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

export const getSubjectColor = (subjectName: string): string => {
  const baseColor = generateColorFromString(subjectName);
  return `bg-[${baseColor}]`;
};

export const getFlairColor = (flairName: string): string => {
  if (!flairName) {
    return "bg-gray-100 text-gray-700 border-gray-300";
  }
  const hash = flairName.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const colorMap = [
    { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" },
    { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
    { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
    {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      border: "border-yellow-300",
    },
    {
      bg: "bg-purple-100",
      text: "text-purple-700",
      border: "border-purple-300",
    },
    { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-300" },
    {
      bg: "bg-indigo-100",
      text: "text-indigo-700",
      border: "border-indigo-300",
    },
    {
      bg: "bg-orange-100",
      text: "text-orange-700",
      border: "border-orange-300",
    },
    { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-300" },
    { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-300" },
  ];

  const index = Math.abs(hash) % colorMap.length;
  const colors = colorMap[index];
  return `${colors.bg} ${colors.text} ${colors.border}`;
};

export const getSubjectBadgeColor = (subjectName: string): string => {
  if (!subjectName) {
    return "bg-gray-500";
  }
  const hash = subjectName.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-teal-500",
    "bg-yellow-600",
    "bg-red-500",
    "bg-indigo-500",
    "bg-cyan-500",
    "bg-emerald-500",
    "bg-violet-500",
    "bg-fuchsia-500",
    "bg-rose-500",
    "bg-amber-500",
  ];

  const index = Math.abs(hash) % colors.length;
  return colors[index];
};
