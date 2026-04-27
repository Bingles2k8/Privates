import ExpoModulesCore

// Marks files as excluded from iCloud Backup AND device-to-device transfer
// (iTunes / Finder backup) by setting NSURLIsExcludedFromBackupKey on the
// underlying NSURL. This is the only Apple-documented way to keep a file in
// the app's Documents directory off backups while still having it persist
// between launches (Library/Caches can be evicted under storage pressure;
// tmp/ likewise).
//
// Two design notes:
//
// 1. The flag is per-file, not per-directory. Setting it on a directory
//    does NOT propagate to children. Callers must invoke this for each
//    file they want excluded — including SQLite WAL/SHM sidecars that
//    appear lazily on first write.
//
// 2. The flag is persistent: once set, it survives across app launches
//    and OS updates. We expose isExcludedFromBackup so callers can verify
//    after a reinstall without redundantly writing the flag.

public class BackupExclusionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("BackupExclusionModule")

    AsyncFunction("setExcludedFromBackup") { (absolutePath: String, excluded: Bool) -> Bool in
      let url = URL(fileURLWithPath: absolutePath)
      // Bail before touching the disk if the file isn't there — iOS will
      // throw on setResourceValues for a non-existent path, and the caller
      // can decide whether to retry later (e.g. after the WAL file appears).
      guard FileManager.default.fileExists(atPath: absolutePath) else {
        return false
      }
      var mutableUrl = url
      var values = URLResourceValues()
      values.isExcludedFromBackup = excluded
      do {
        try mutableUrl.setResourceValues(values)
        return true
      } catch {
        return false
      }
    }

    AsyncFunction("isExcludedFromBackup") { (absolutePath: String) -> Bool in
      let url = URL(fileURLWithPath: absolutePath)
      guard FileManager.default.fileExists(atPath: absolutePath) else {
        return false
      }
      do {
        let values = try url.resourceValues(forKeys: [.isExcludedFromBackupKey])
        return values.isExcludedFromBackup ?? false
      } catch {
        return false
      }
    }
  }
}
