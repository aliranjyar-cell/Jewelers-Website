export const MAX_LENGTH = 128;

export function evaluatePassword(password, { current = '', context = [] } = {}) {
  const normalized = password.toLowerCase();
  const personalTerms = context
    .flatMap((value) => String(value || '').toLowerCase().split(/[\s@._+-]+/))
    .filter((term) => term.length >= 3);
  const characterTypes = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;
  const rules = [
    { id: 'length', label: 'At least 12 characters', met: password.length >= 12 },
    {
      id: 'strength',
      label: '16+ characters or a mix of at least three character types',
      met: password.length >= 16 || characterTypes >= 3,
    },
    { id: 'different', label: 'Different from your current password', met: password.length > 0 && password !== current },
    {
      id: 'personal',
      label: 'Does not include your name or email',
      met: !personalTerms.some((term) => normalized.includes(term)),
    },
  ];
  const score = rules.filter((rule) => rule.met).length;
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const issue = password.length > MAX_LENGTH
    ? `Use no more than ${MAX_LENGTH} characters.`
    : rules.find((rule) => !rule.met)?.id === 'length'
      ? 'Use at least 12 characters.'
      : rules.find((rule) => !rule.met)?.id === 'strength'
        ? 'Use at least 16 characters, or include at least three types of characters.'
        : rules.find((rule) => !rule.met)?.id === 'different'
          ? 'Choose a password different from your current password.'
          : rules.find((rule) => !rule.met)?.id === 'personal'
            ? 'Do not include your name or email address in the password.'
            : '';

  return { valid: password.length <= MAX_LENGTH && rules.every((rule) => rule.met), issue, score, label: labels[score], rules };
}
