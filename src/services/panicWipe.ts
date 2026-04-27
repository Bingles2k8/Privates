import { wipeAllKeys } from '@/crypto/keys';
import { closeDatabase, DB_FILES, deleteDbFiles, type DbVariant } from '@/db';
import { useSession } from '@/state/session';

export async function panicWipe(): Promise<void> {
  closeDatabase();
  await wipeAllKeys();
  // Delete every variant's on-disk footprint. `deleteDbFiles` handles each
  // variant's main file plus its journal/WAL/SHM sidecars, so adding a new
  // variant to DB_FILES automatically gets wiped here too.
  for (const variant of Object.keys(DB_FILES) as DbVariant[]) {
    await deleteDbFiles(variant);
  }
  useSession.getState().setStatus('needsOnboarding');
}
