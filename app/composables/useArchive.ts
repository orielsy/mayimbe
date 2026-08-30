import archiveData from '~~/generated/archive.json'
import type { ArchiveIndex } from '~~/core/archive'

export function useArchive(): ArchiveIndex {
  return archiveData as ArchiveIndex
}
