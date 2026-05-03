export const HYDRATION_QUOTES = [
  'Water is the driving force of all nature. — Leonardo da Vinci',
  'Thousands have lived without love, not one without water. — W.H. Auden',
  'Water is the most critical resource issue of our lifetime.',
  'Drink water like your life depends on it — because it does.',
  'Every cell in your body needs water to function properly.',
  'Feeling tired? Drink water. Feeling hungry? Drink water first.',
  'Hydration is the foundation of health, energy, and clarity.',
  'Your skin is your largest organ. Keep it hydrated!',
  'A 2% drop in body water can trigger short-term memory trouble.',
  '75% of Americans are chronically dehydrated. Don\'t be one of them.',
  'Water flushes toxins, boosts energy, and clears your mind.',
  'The best investment? A water bottle you actually use.',
  'Drinking enough water can prevent headaches by up to 50%.',
  'Your brain is 75% water. Stay sharp — stay hydrated.',
  'Small consistent habits lead to big transformations.',
  'Every sip counts. You\'re doing great today!',
  'Hydration is self-care in its purest form.',
  'Drink water before meals to boost metabolism.',
  'Cold water boosts your metabolism by up to 30% for 90 minutes.',
  'Water: nature\'s best energy drink.',
  'One glass at a time. You\'ve got this!',
  'Hydrated people are happier people. Science agrees.',
  'Water is always the right answer.',
  'Your future self will thank you for every glass today.',
  'Strong body, sharp mind — it starts with water.',
  'Water is life\'s matter and matrix, its mother and medium.',
  'Make hydration your superpower.',
  'Each glass brings you closer to your best self.',
  'Water: free, pure, and essential. Never skip it.',
  'Consistency is the secret to a well-hydrated life.',
];

export function getDailyQuote(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return HYDRATION_QUOTES[dayOfYear % HYDRATION_QUOTES.length];
}

export const HYDRATION_FACTS = [
  '💡 Your kidneys can process about 1 litre of water per hour.',
  '💡 Drinking cold water burns ~8 extra calories per glass.',
  '💡 The human body is about 60% water.',
  '💡 You lose up to 2.5L of water per day through normal activity.',
  '💡 Caffeinated drinks don\'t dehydrate you as much as once thought.',
  '💡 Water is essential for every organ in your body.',
  '💡 Proper hydration can reduce joint pain significantly.',
  '💡 Athletes can lose 6–10% of body weight through sweat.',
];
