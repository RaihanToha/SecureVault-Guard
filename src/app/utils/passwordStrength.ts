export interface PasswordCriteria {
  label: string;
  met: boolean;
  tip: string;
}

export interface PasswordStrengthReport {
  score: number; // 0 to 100
  level: "Weak" | "Medium" | "Strong" | "Very Strong";
  colorClass: string; // Tailwind bg color for progress bar
  trackColorClass: string; // Background for progress track
  textColorClass: string;
  badgeClass: string;
  criteria: PasswordCriteria[];
  suggestions: string[];
  suggestedPassword: string;
}

const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const COMMON_WEAK_PATTERNS = [
  "password",
  "123456",
  "12345678",
  "qwerty",
  "admin",
  "welcome",
  "yt123",
  "iloveyou",
  "secret",
];

export function generateSecurePassword(length = 16): string {
  const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // exclude easily confused I, O
  const lowers = "abcdefghijkmnpqrstuvwxyz"; // exclude l, o
  const numbers = "23456789"; // exclude 0, 1
  const symbols = "!@#$%^&*()_+~=";

  const all = uppers + lowers + numbers + symbols;

  // Guarantee at least one of each category
  const guaranteed = [
    uppers[Math.floor(Math.random() * uppers.length)],
    lowers[Math.floor(Math.random() * lowers.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  const remainingLength = Math.max(0, length - guaranteed.length);
  const remaining = Array.from({ length: remainingLength }, () =>
    all[Math.floor(Math.random() * all.length)]
  );

  // Shuffle together
  const combined = [...guaranteed, ...remaining];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  return combined.join("");
}

export function evaluatePassword(pass: string): PasswordStrengthReport {
  if (!pass) {
    return {
      score: 0,
      level: "Weak",
      colorClass: "bg-gray-300",
      trackColorClass: "bg-gray-100",
      textColorClass: "text-gray-500",
      badgeClass: "bg-gray-100 text-gray-600 border-gray-200",
      criteria: [],
      suggestions: ["Enter a password to evaluate strength."],
      suggestedPassword: generateSecurePassword(16),
    };
  }

  const length = pass.length;
  const hasUpper = /[A-Z]/.test(pass);
  const hasLower = /[a-z]/.test(pass);
  const hasNumber = /[0-9]/.test(pass);
  const hasSymbol = /[^A-Za-z0-9]/.test(pass);
  const isCommon = COMMON_WEAK_PATTERNS.some((pat) =>
    pass.toLowerCase().includes(pat)
  );
  const hasRepetition = /(.)\1{2,}/.test(pass); // e.g. aaa, 111

  // Criteria evaluation
  const criteria: PasswordCriteria[] = [
    {
      label: "At least 12 characters",
      met: length >= 12,
      tip: `Current length is ${length} chars. Aim for 12-16+ characters.`,
    },
    {
      label: "Contains uppercase letters (A-Z)",
      met: hasUpper,
      tip: "Include capital letters to increase combination entropy.",
    },
    {
      label: "Contains lowercase letters (a-z)",
      met: hasLower,
      tip: "Include lowercase characters.",
    },
    {
      label: "Contains numbers (0-9)",
      met: hasNumber,
      tip: "Add numeric digits throughout the password.",
    },
    {
      label: "Contains special symbols (!@#$)",
      met: hasSymbol,
      tip: "Add special symbols such as !, @, #, $, %, ^, &, *.",
    },
    {
      label: "No common dictionary or consecutive patterns",
      met: !isCommon && !hasRepetition,
      tip: "Avoid simple words, sequential keys, or repeating characters.",
    },
  ];

  // Point scoring:
  let points = 0;
  if (length >= 8) points += 20;
  if (length >= 12) points += 20;
  if (length >= 16) points += 10;
  if (hasUpper) points += 15;
  if (hasLower) points += 10;
  if (hasNumber) points += 15;
  if (hasSymbol) points += 15;
  if (isCommon || length < 6) points = Math.min(points, 25);
  if (hasRepetition) points = Math.max(10, points - 15);

  const score = Math.max(10, Math.min(100, points));

  // Build specific actionable suggestions
  const suggestions: string[] = [];
  if (length < 8) {
    suggestions.push(`Critically short (${length} chars). Extend to at least 12 characters.`);
  } else if (length < 12) {
    suggestions.push(`Add ${12 - length} more characters to reach the recommended 12+ standard.`);
  }
  if (!hasUpper) {
    suggestions.push("Add at least one uppercase letter (e.g. A, B, C).");
  }
  if (!hasNumber) {
    suggestions.push("Add numeric digits (e.g. 2, 7, 9) non-consecutively.");
  }
  if (!hasSymbol) {
    suggestions.push("Include special symbols (e.g. ! @ # $ % ^ & *).");
  }
  if (isCommon) {
    suggestions.push("Remove predictable dictionary words or common phrases.");
  }
  if (hasRepetition) {
    suggestions.push("Avoid repeated consecutive characters (e.g. 'aaa' or '111').");
  }

  if (suggestions.length === 0) {
    suggestions.push("Excellent! This password adheres to zero-trust NIST security standards.");
  }

  // Levels & colors
  let level: "Weak" | "Medium" | "Strong" | "Very Strong";
  let colorClass = "bg-red-500";
  let textColorClass = "text-red-600";
  let badgeClass = "bg-red-50 text-red-700 border-red-200";

  if (score < 40) {
    level = "Weak";
    colorClass = "bg-red-500";
    textColorClass = "text-red-600";
    badgeClass = "bg-red-50 text-red-700 border-red-200";
  } else if (score < 70) {
    level = "Medium";
    colorClass = "bg-amber-500";
    textColorClass = "text-amber-600";
    badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (score < 90) {
    level = "Strong";
    colorClass = "bg-emerald-500";
    textColorClass = "text-emerald-600";
    badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else {
    level = "Very Strong";
    colorClass = "bg-indigo-600";
    textColorClass = "text-indigo-600";
    badgeClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
  }

  return {
    score,
    level,
    colorClass,
    trackColorClass: "bg-gray-100",
    textColorClass,
    badgeClass,
    criteria,
    suggestions,
    suggestedPassword: generateSecurePassword(Math.max(16, length + 4)),
  };
}
