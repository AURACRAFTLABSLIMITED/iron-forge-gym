/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/admin/AdminNewsletterPage.tsx
 * Purpose: Displays newsletter email subscribers with copy-all and delete actions.
 */

import React from 'react';
import { Copy, Trash2 } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import {
  deleteSubscriber,
  getAllSubscribersAdmin,
} from '../../services/contactService';
import { useSite } from '../../context/SiteContext';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { formatDate } from '../../utils/helpers';

export default function AdminNewsletterPage() {
  const { showToast } = useSite();
  const {
    data: subscribers,
    loading,
    refetch,
  } = useFirestore(() => getAllSubscribersAdmin(200), []);

  const handleCopyAll = async () => {
    const emails = subscribers.map((s) => s.email).join(', ');
    if (!emails) return;
    await navigator.clipboard.writeText(emails);
    showToast(`Copied ${subscribers.length} subscriber emails.`);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSubscriber(id);
      showToast('Subscriber removed.');
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold uppercase text-white">
            Newsletter Subscribers
          </h1>
          <p className="text-sm text-neutral-400">
            {subscribers.length} subscribed contacts.
          </p>
        </div>
        <Button variant="secondary" disabled={subscribers.length === 0} onClick={handleCopyAll}>
          <Copy size={15} />
          <span>Copy All Emails</span>
        </Button>
      </div>

      {loading ? (
        <Loader label="Loading subscribers..." />
      ) : subscribers.length === 0 ? (
        <div className="p-10 text-center rounded-lg bg-[#14171A] border border-white/10 text-neutral-400">
          No newsletter subscribers yet.
        </div>
      ) : (
        <div className="rounded-lg bg-[#14171A] border border-white/10 divide-y divide-white/5">
          {subscribers.map((sub) => (
            <div
              key={sub.id}
              className="px-5 py-3.5 flex items-center justify-between gap-4 text-sm"
            >
              <div>
                <p className="text-white font-medium">{sub.email}</p>
                <p className="text-xs text-neutral-500">Subscribed {formatDate(sub.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(sub.id)}
                aria-label={`Remove ${sub.email}`}
                className="p-2 rounded text-red-400 hover:bg-red-500/10"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
