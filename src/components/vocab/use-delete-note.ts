import { useTranslation } from 'react-i18next';

import { useToast } from '@/components/ui';
import { deleteVocabNote, restoreVocabNote } from '@/stores/vocab-store';

let lastToastId = 0;

/** Deletes a note right away and offers to undo it in a toast. */
export function useDeleteVocabNote() {
  const { t } = useTranslation();
  const { toast } = useToast();

  return (key: string) => {
    const snapshot = deleteVocabNote(key);
    if (!snapshot) return;
    lastToastId += 1;
    const id = `vocab-deleted-${lastToastId}`;
    toast.show({
      id,
      label: t('vocab.deleted', { term: snapshot.term }),
      actionLabel: t('vocab.undo'),
      onActionPress: ({ hide }) => {
        restoreVocabNote(snapshot);
        hide(id);
      },
    });
  };
}
