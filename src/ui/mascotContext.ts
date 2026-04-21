import type { MascotMood } from '@/ui/Mascot';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export function timeOfDay(date = new Date()): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

export type MascotScreen = 'today' | 'calendar' | 'insights' | 'settings';

export type MascotContextInput = {
  screen: MascotScreen;
  now?: Date;
  fertile?: { inWindow: boolean; daysToOv: number } | null;
  cycleDay?: number | null;
  daysToPeriod?: number | null;
  streak?: { current: number; loggedToday: boolean; last7: number } | null;
};

export type MascotContextOutput = {
  mood: MascotMood;
  greeting: string;
};

function pick<T>(arr: readonly T[], seed: number): T {
  const i = Math.abs(Math.floor(seed)) % arr.length;
  return arr[i];
}

function daySeed(now: Date) {
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

const MORNING = ['good morning ☼', 'mornin\u2019 sunshine', 'up early, legend', 'hi, sleepyhead'] as const;
const AFTERNOON = ['afternoon check-in', 'hi hi hi', 'still going strong', 'middle-of-the-day wave'] as const;
const EVENING = ['evening, you', 'hi, cozy hours', 'soft evening energy', 'winding down?'] as const;
const NIGHT = ['up late? same', 'night owl hours', 'hi, quiet hours', 'moon mode'] as const;

function timeGreeting(t: TimeOfDay, seed: number): string {
  const pool = t === 'morning' ? MORNING : t === 'afternoon' ? AFTERNOON : t === 'evening' ? EVENING : NIGHT;
  return pick(pool, seed);
}

export function mascotContext(input: MascotContextInput): MascotContextOutput {
  const now = input.now ?? new Date();
  const t = timeOfDay(now);
  const seed = daySeed(now) + (input.screen === 'today' ? 0 : input.screen === 'calendar' ? 1 : input.screen === 'insights' ? 2 : 3);

  const onPeriod = (input.cycleDay ?? 99) <= 5 && (input.cycleDay ?? 0) >= 1;
  const isFertile = input.fertile?.inWindow === true;
  const daysToOv = input.fertile?.daysToOv ?? null;
  const dtp = input.daysToPeriod ?? null;
  const pms = dtp != null && dtp >= 1 && dtp <= 3;
  const streak = input.streak?.current ?? 0;
  const loggedToday = input.streak?.loggedToday ?? false;

  // Proud / celebrate moods: big streaks or first-of-the-day log
  if (streak >= 7 && loggedToday && input.screen === 'today') {
    return {
      mood: 'celebrate',
      greeting: pick(
        [`${streak} days in a row ✦`, 'streak superstar', 'you\u2019re on fire', `${streak}-day streak!`],
        seed,
      ),
    };
  }
  if (streak >= 3 && loggedToday && input.screen === 'today') {
    return {
      mood: 'proud',
      greeting: pick([`${streak} in a row`, 'proud of you', 'keeping it up ✿', 'little streak, big mood'], seed),
    };
  }

  // Screen-specific framing
  if (input.screen === 'calendar') {
    if (isFertile) {
      return {
        mood: 'bright',
        greeting: pick(
          ['window\u2019s open ✦', 'fertile vibes', 'prime days, hi', 'sparkly week'],
          seed,
        ),
      };
    }
    if (onPeriod) {
      return {
        mood: 'sleepy',
        greeting: pick(
          ['period mode 💧', 'rest week', 'hot water bottle o\u2019clock', 'be gentle this week'],
          seed,
        ),
      };
    }
    if (pms) {
      return {
        mood: 'tired',
        greeting: pick(
          [`${dtp} days to hell week`, 'pms incoming, babe', `${dtp} days, brace`, 'soft mode engaged'],
          seed,
        ),
      };
    }
    if (dtp != null && dtp > 5 && dtp <= 14) {
      return {
        mood: 'calm',
        greeting: pick(
          [`${dtp} days to next period`, 'mid-cycle chill', 'calm waters', 'the in-between'],
          seed,
        ),
      };
    }
    if (daysToOv != null && daysToOv >= 1 && daysToOv <= 3) {
      return {
        mood: 'bright',
        greeting: pick(
          [`${daysToOv} days to ovulation`, 'egg incoming ✦', 'prime window soon', 'fertile week ahead'],
          seed,
        ),
      };
    }
    return { mood: 'calm', greeting: timeGreeting(t, seed) };
  }

  if (input.screen === 'insights') {
    if (streak >= 14) {
      return { mood: 'celebrate', greeting: pick(['look at these patterns', 'data queen', 'big patterns energy'], seed) };
    }
    if (streak >= 5) {
      return { mood: 'proud', greeting: pick(['nice data, nice you', 'patterns emerging', 'we love a trend'], seed) };
    }
    if (input.streak && input.streak.last7 <= 1) {
      return {
        mood: 'missed',
        greeting: pick(['need more data, babe', 'log more, learn more', 'hmm, sparse week'], seed),
      };
    }
    return {
      mood: 'calm',
      greeting: pick(['numbers corner', 'pattern time', 'your shape', 'your cycle\u2019s shape'], seed),
    };
  }

  if (input.screen === 'settings') {
    return {
      mood: 'calm',
      greeting: pick(['your fortress ✿', 'make it yours', 'the knobs & dials', 'private little space'], seed),
    };
  }

  // today screen
  if (isFertile) {
    return {
      mood: 'bright',
      greeting: pick(
        ['feeling zingy ✦', 'window\u2019s open', 'sparkly day', 'prime time energy'],
        seed,
      ),
    };
  }
  if (onPeriod) {
    return {
      mood: 'sleepy',
      greeting: pick(
        ['rest mode, babe', 'be gentle today', 'snuggle mode', 'period mode 💧'],
        seed,
      ),
    };
  }
  if (pms) {
    return {
      mood: 'tired',
      greeting: pick(
        ['soft week ahead', `${dtp} days, brace`, 'pms hours', 'be extra nice to you'],
        seed,
      ),
    };
  }
  if (!loggedToday && (t === 'evening' || t === 'night')) {
    return {
      mood: 'missed',
      greeting: pick(['log today?', 'anything to note?', 'quick check-in?', 'how was today?'], seed),
    };
  }
  return { mood: 'calm', greeting: timeGreeting(t, seed) };
}
