import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { File } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardTitle } from '@/ui/Card';
import { HandIcon } from '@/ui/HandIcon';
import { PrimaryButton } from '@/ui/PrimaryButton';
import { Screen } from '@/ui/Screen';
import {
  createEncryptedBackup,
  restoreEncryptedBackup,
  type RestoreStats,
} from '@/services/backup';
import { exportCsvBundle, importCsvBundle, type CsvImportStats } from '@/services/csv';
import { describeError } from '@/util/describeError';
import { useTheme } from '@/theme/useTheme';

const MIN = 12;

export default function BackupScreen() {
  const { palette } = useTheme();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'save' | 'restore'>('save');

  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const [restoreUri, setRestoreUri] = useState<string | null>(null);
  const [restoreName, setRestoreName] = useState<string | null>(null);
  const [restorePass, setRestorePass] = useState('');
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [restoreStats, setRestoreStats] = useState<RestoreStats | null>(null);

  const [csvBusy, setCsvBusy] = useState(false);
  const [csvSavedAt, setCsvSavedAt] = useState<string | null>(null);
  const [csvStats, setCsvStats] = useState<CsvImportStats | null>(null);

  const ok = pass.length >= MIN && pass === confirm;

  async function onSave() {
    try {
      setBusy(true);
      const uri = await createEncryptedBackup(pass);
      setSavedAt(uri);
      setPass('');
      setConfirm('');
    } catch (e: unknown) {
      Alert.alert('Backup failed', describeError(e));
    } finally {
      setBusy(false);
    }
  }

  async function onPickFile() {
    const res = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (res.canceled || !res.assets?.[0]) return;
    setRestoreUri(res.assets[0].uri);
    setRestoreName(res.assets[0].name);
    setRestoreStats(null);
  }

  async function onCsvExport() {
    try {
      setCsvBusy(true);
      setCsvStats(null);
      const uri = await exportCsvBundle();
      setCsvSavedAt(uri);
    } catch (e: unknown) {
      Alert.alert('CSV export failed', describeError(e));
    } finally {
      setCsvBusy(false);
    }
  }

  async function onCsvImport() {
    const res = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const uri = res.assets[0].uri;
    Alert.alert(
      'Merge this CSV bundle?',
      'Rows are matched by ID (or by date, for day logs) and updated in place. New rows are added. Nothing is deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Merge',
          onPress: async () => {
            try {
              setCsvBusy(true);
              setCsvSavedAt(null);
              const stats = await importCsvBundle(uri);
              setCsvStats(stats);
              qc.invalidateQueries();
            } catch (e: unknown) {
              Alert.alert('CSV import failed', describeError(e));
            } finally {
              setCsvBusy(false);
            }
          },
        },
      ],
    );
  }

  async function onRestore() {
    if (!restoreUri || !restorePass) return;
    Alert.alert(
      'Replace everything?',
      'This wipes your current data and loads the backup in its place. The device encryption key stays the same.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            try {
              setRestoreBusy(true);
              const file = new File(restoreUri);
              const json = file.textSync();
              const stats = await restoreEncryptedBackup(json, restorePass);
              setRestoreStats(stats);
              setRestorePass('');
              qc.invalidateQueries();
            } catch (e: unknown) {
              const msg = describeError(e);
              Alert.alert(
                'Restore failed',
                msg.includes('not a Privates')
                  ? 'That file isn’t a Privates backup.'
                  : msg.includes('decryption')
                    ? 'Wrong passphrase, or the file is corrupted.'
                    : msg,
              );
            } finally {
              setRestoreBusy(false);
            }
          },
        },
      ],
    );
  }

  return (
    <Screen topInset={false} modalHandle>
      <View>
        <Text
          className="text-ink-muted text-sm font-hand"
          style={{ transform: [{ rotate: '-1deg' }] }}
        >
          your data, your file
        </Text>
        <Text className="text-ink text-4xl font-display mt-0.5">Encrypted backup</Text>
      </View>

      <View className="flex-row bg-bg-soft rounded-2xl p-1">
        <TabButton
          label="Save"
          icon="download"
          selected={tab === 'save'}
          onPress={() => setTab('save')}
        />
        <TabButton
          label="Restore"
          icon="upload"
          selected={tab === 'restore'}
          onPress={() => setTab('restore')}
        />
      </View>

      {tab === 'save' ? (
        <>
          <Text className="text-ink-muted leading-5">
            Picks a passphrase, encrypts a snapshot of your data, and writes a .ptbk file to this app&apos;s document
            folder. Move it to iCloud Drive, AirDrop, wherever — it stays unreadable without your passphrase.
          </Text>
          <Text className="text-ink-muted leading-5">
            This is a separate passphrase from the app lock. If you lose it, the backup is unrecoverable.
          </Text>

          <Card>
            <CardTitle>Backup passphrase</CardTitle>
            <TextInput
              value={pass}
              onChangeText={setPass}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="••••••••••••"
              placeholderTextColor={palette.inkDim}
              className="text-ink text-lg py-2"
            />
          </Card>
          <Card>
            <CardTitle>Confirm</CardTitle>
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="••••••••••••"
              placeholderTextColor={palette.inkDim}
              className="text-ink text-lg py-2"
            />
          </Card>
          <PrimaryButton
            label={busy ? 'Encrypting…' : 'Create backup'}
            onPress={onSave}
            disabled={!ok || busy}
          />

          {savedAt && (
            <Card>
              <CardTitle icon={<HandIcon name="check-circle" size={14} color={palette.accent} />}>
                Saved
              </CardTitle>
              <Text className="text-ink text-sm" selectable>
                {savedAt}
              </Text>
            </Card>
          )}
        </>
      ) : (
        <>
          <Text className="text-ink-muted leading-5">
            Pick a .ptbk file you saved earlier and enter its passphrase. Your current data on this device will be{' '}
            <Text className="text-ink font-bold">replaced</Text> with the backup contents.
          </Text>

          <Card>
            <CardTitle icon={<HandIcon name="book-open" size={14} color={palette.inkMuted} />}>
              Backup file
            </CardTitle>
            <Pressable
              onPress={onPickFile}
              className="bg-bg-soft rounded-2xl p-3 active:opacity-70"
            >
              <Text className="text-ink text-sm" numberOfLines={1}>
                {restoreName ?? 'Tap to pick a .ptbk file'}
              </Text>
            </Pressable>
          </Card>

          <Card>
            <CardTitle>Backup passphrase</CardTitle>
            <TextInput
              value={restorePass}
              onChangeText={setRestorePass}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="••••••••••••"
              placeholderTextColor={palette.inkDim}
              className="text-ink text-lg py-2"
            />
          </Card>

          <PrimaryButton
            label={restoreBusy ? 'Restoring…' : 'Restore from backup'}
            variant="danger"
            icon={<HandIcon name="alert-triangle" size={16} color="white" />}
            onPress={onRestore}
            disabled={!restoreUri || !restorePass || restoreBusy}
          />

          {restoreStats && (
            <Card>
              <CardTitle icon={<HandIcon name="check-circle" size={14} color={palette.accent} />}>
                Restored
              </CardTitle>
              <View className="gap-1">
                <StatLine label="day logs" n={restoreStats.dayLogs} />
                <StatLine label="cycles" n={restoreStats.cycles} />
                <StatLine label="symptoms" n={restoreStats.symptoms} />
                <StatLine label="moods" n={restoreStats.moods} />
                <StatLine label="medications" n={restoreStats.medications} />
                <StatLine label="custom tags" n={restoreStats.customTags} />
              </View>
            </Card>
          )}
        </>
      )}

      <View className="mt-4">
        <Text
          className="text-ink-muted text-sm font-hand"
          style={{ transform: [{ rotate: '-1deg' }] }}
        >
          for spreadsheets, or jumping apps
        </Text>
        <Text className="text-ink text-2xl font-display mt-0.5">CSV bundle</Text>
      </View>

      <Card>
        <CardTitle icon={<HandIcon name="alert-triangle" size={14} color={palette.inkMuted} />}>
          Not encrypted
        </CardTitle>
        <Text className="text-ink-muted leading-5 text-sm">
          CSVs are plain text. Anyone with the file can read your data. Use this for opening in a spreadsheet or moving to another tracker — never for long-term storage. For storage, use the encrypted backup above.
        </Text>
      </Card>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <PrimaryButton
            label={csvBusy ? 'Working…' : 'Export CSV'}
            icon={<HandIcon name="download" size={16} color="white" />}
            onPress={onCsvExport}
            disabled={csvBusy}
          />
        </View>
        <View className="flex-1">
          <PrimaryButton
            label={csvBusy ? 'Working…' : 'Import CSV'}
            variant="secondary"
            icon={<HandIcon name="upload" size={16} color="#666" />}
            onPress={onCsvImport}
            disabled={csvBusy}
          />
        </View>
      </View>

      {csvSavedAt && (
        <Card>
          <CardTitle icon={<HandIcon name="check-circle" size={14} color={palette.accent} />}>
            Exported
          </CardTitle>
          <Text className="text-ink text-sm" selectable>
            {csvSavedAt}
          </Text>
        </Card>
      )}

      {csvStats && (
        <Card>
          <CardTitle icon={<HandIcon name="check-circle" size={14} color={palette.accent} />}>
            Merged
          </CardTitle>
          <View className="gap-1">
            <CsvStatLine label="day logs" stat={csvStats.dayLogs} />
            <CsvStatLine label="cycles" stat={csvStats.cycles} />
            <CsvStatLine label="symptoms" stat={csvStats.symptoms} />
            <CsvStatLine label="moods" stat={csvStats.moods} />
            <CsvStatLine label="medications" stat={csvStats.medications} />
            <CsvStatLine label="med doses" stat={csvStats.medDoses} />
            <CsvStatLine label="custom tags" stat={csvStats.customTags} />
          </View>
        </Card>
      )}
    </Screen>
  );
}

function TabButton({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: 'download' | 'upload';
  selected: boolean;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 flex-row items-center justify-center gap-2 py-2 rounded-xl ${selected ? 'bg-bg-card' : ''}`}
      style={
        selected
          ? {
              borderWidth: 1.5,
              borderColor: palette.ink,
              shadowColor: palette.ink,
              shadowOpacity: 0.9,
              shadowRadius: 0,
              shadowOffset: { width: 1, height: 1 },
            }
          : undefined
      }
    >
      <HandIcon name={icon} size={14} color={selected ? palette.ink : palette.inkMuted} />
      <Text className={`text-sm ${selected ? 'text-ink font-bold' : 'text-ink-muted'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

function StatLine({ label, n }: { label: string; n: number }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-ink-muted text-sm">{label}</Text>
      <Text className="text-ink text-sm font-bold">{n}</Text>
    </View>
  );
}

function CsvStatLine({
  label,
  stat,
}: {
  label: string;
  stat: { inserted: number; updated: number };
}) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-ink-muted text-sm">{label}</Text>
      <Text className="text-ink text-sm font-bold">
        +{stat.inserted} new · {stat.updated} updated
      </Text>
    </View>
  );
}
