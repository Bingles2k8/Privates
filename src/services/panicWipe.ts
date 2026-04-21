import { File, Paths } from 'expo-file-system';
import { wipeAllKeys } from '@/crypto/keys';
import { closeDatabase, DB_FILES } from '@/db';
import { useSession } from '@/state/session';

// Every sidecar file SQLCipher/SQLite might have written for either variant.
function allDbSidecars(): string[] {
  const out: string[] = [];
  for (const base of Object.values(DB_FILES)) {
    out.push(base, `${base}-journal`, `${base}-wal`, `${base}-shm`);
  }
  return out;
}

export async function panicWipe(): Promise<void> {
  closeDatabase();
  await wipeAllKeys();
  for (const name of allDbSidecars()) {
    try {
      const f = new File(Paths.document, name);
      if (f.exists) f.delete();
    } catch {
      // best effort
    }
  }
  useSession.getState().setStatus('needsOnboarding');
}
