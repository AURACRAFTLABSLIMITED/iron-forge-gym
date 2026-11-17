/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/admin/AdminMembersPage.tsx
 * Purpose: Full member directory management: search, status filter, add/edit/delete member,
 *          assign or renew packages, record manual cash payment, and toggle admin custom claims.
 */

import React, { useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, RefreshCw, Shield, CheckCircle2 } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import {
  assignPackageToMember,
  deleteMemberAdmin,
  getAllMembersAdmin,
  saveMemberAdmin,
} from '../../services/membersService';
import { getPackages } from '../../services/packagesService';
import { getAllOrdersAdmin } from '../../services/shopService';
import { markOrderPaidAdmin, setUserRoleAdmin } from '../../services/paymentsService';
import { samplePackages } from '../../utils/seedData.js';
import { GymPackage, MemberProfile, MembershipStatus, Order } from '../../types/models';
import { useSite } from '../../context/SiteContext';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';

const EMPTY_FORM = {
  displayName: '',
  email: '',
  phone: '',
  emergencyContact: '',
  membershipStatus: 'none' as MembershipStatus,
  planName: 'No Active Plan',
  planExpiryDate: '',
};

export default function AdminMembersPage() {
  const { showToast } = useSite();
  const { data: members, loading, refetch } = useFirestore(() => getAllMembersAdmin(200), []);
  const { data: packages } = useFirestore(() => getPackages(30), samplePackages);
  const { data: orders, refetch: refetchOrders } = useFirestore(() => getAllOrdersAdmin(120), []);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MembershipStatus>('all');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [assignMember, setAssignMember] = useState<MemberProfile | null>(null);
  const [selectedPkgId, setSelectedPkgId] = useState('');
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);

  const memberPaymentMap = useMemo(() => {
    const map = new Map<string, { unpaid?: Order; paid?: Order }>();
    orders.forEach((order) => {
      if (order.orderType !== 'membership' || !order.userId) return;
      const current = map.get(order.userId) || {};
      if (order.paymentStatus !== 'paid' && order.status !== 'cancelled' && !current.unpaid) {
        current.unpaid = order;
      }
      if (order.paymentStatus === 'paid' && !current.paid) {
        current.paid = order;
      }
      map.set(order.userId, current);
    });
    return map;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      const matchesStatus = statusFilter === 'all' || m.membershipStatus === statusFilter;
      const matchesQuery =
        !q ||
        m.displayName?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.phone?.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [members, search, statusFilter]);

  const openCreate = () => {
    setEditingMemberId(null);
    setForm(EMPTY_FORM);
    setEditModalOpen(true);
  };

  const openEdit = (member: MemberProfile) => {
    setEditingMemberId(member.id || member.uid);
    setForm({
      displayName: member.displayName || '',
      email: member.email || '',
      phone: member.phone || '',
      emergencyContact: member.emergencyContact || '',
      membershipStatus: member.membershipStatus || 'none',
      planName: member.planName || 'No Active Plan',
      planExpiryDate: member.planExpiryDate || '',
    });
    setEditModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveMemberAdmin(editingMemberId, form);
      showToast(editingMemberId ? 'Member updated.' : 'Member added.');
      setEditModalOpen(false);
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (member: MemberProfile) => {
    const targetId = member.id || member.uid;
    if (!window.confirm(`Delete member record for ${member.displayName}?`)) return;
    try {
      await deleteMemberAdmin(targetId);
      showToast('Member deleted.');
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.', 'error');
    }
  };

  const handleAssignPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignMember || !selectedPkgId) return;
    const pkg = packages.find((p) => p.id === selectedPkgId) as GymPackage | undefined;
    if (!pkg) return;

    setSaving(true);
    try {
      await assignPackageToMember(assignMember.id || assignMember.uid, pkg);
      showToast(`Assigned ${pkg.name} to ${assignMember.displayName}.`);
      setAssignMember(null);
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to assign package.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkMemberOrderPaid = async (member: MemberProfile, unpaidOrder: Order) => {
    const uid = member.id || member.uid;
    setBusyMemberId(uid);
    try {
      await markOrderPaidAdmin(unpaidOrder.id, unpaidOrder.orderType);
      const matchedPkg = packages.find(
        (p) => p.id === (unpaidOrder.packageId || unpaidOrder.items?.[0]?.id)
      );
      if (matchedPkg) {
        await assignPackageToMember(uid, matchedPkg);
      }
      showToast(`Marked cash payment paid and activated plan for ${member.displayName}.`);
      await Promise.all([refetch(), refetchOrders()]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to mark paid.', 'error');
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleToggleRole = async (member: MemberProfile) => {
    const uid = member.id || member.uid;
    const nextRole = member.role === 'admin' ? 'member' : 'admin';
    if (!window.confirm(`Change ${member.displayName}'s role to "${nextRole}"?`)) return;

    setBusyMemberId(uid);
    try {
      await setUserRoleAdmin(uid, nextRole);
      showToast(`Updated ${member.displayName} role to ${nextRole}.`);
      await refetch();
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'Role update requires deployed Cloud Functions (setUserRole).',
        'error'
      );
    } finally {
      setBusyMemberId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold uppercase text-white">Members</h1>
          <p className="text-sm text-neutral-400">
            Search members, confirm cash payments, assign packages, and manage admin roles.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          <span>Add Member</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 justify-between">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="w-full md:w-80 min-h-[42px] px-3.5 rounded bg-[#14171A] border border-white/15 text-sm text-white"
        />
        <div className="flex flex-wrap gap-2">
          {(['all', 'active', 'expired', 'pending', 'none'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`min-h-[40px] px-3.5 rounded text-xs font-semibold uppercase border ${
                statusFilter === status
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--accent)]'
                  : 'bg-[#14171A] text-neutral-300 border-white/10'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loader label="Loading members..." />
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center rounded-lg bg-[#14171A] border border-white/10 text-neutral-400">
          No members found matching your filter.
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-lg bg-[#14171A] border border-white/10 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-white/10 text-xs uppercase text-neutral-400">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Plan &amp; Expiry</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((m) => {
                  const uid = m.id || m.uid;
                  const payInfo = memberPaymentMap.get(uid);
                  const unpaidOrder = payInfo?.unpaid;
                  const paidOrder = payInfo?.paid;

                  return (
                    <tr key={uid} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{m.displayName}</p>
                        <p className="text-xs text-neutral-400">
                          {m.email} {m.phone ? `· ${m.phone}` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={busyMemberId === uid}
                          onClick={() => handleToggleRole(m)}
                          title="Toggle Admin / Member custom claim"
                          className="inline-flex items-center gap-1 text-xs uppercase font-semibold text-neutral-300 hover:text-[var(--accent)]"
                        >
                          <Shield size={13} />
                          <span>{m.role || 'member'}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-neutral-200">{m.planName || 'None'}</p>
                        <p className="font-mono text-xs tabular-nums text-neutral-400">
                          {m.planExpiryDate || '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs uppercase font-semibold text-[var(--accent)]">
                        {m.membershipStatus}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {unpaidOrder ? (
                          <div className="space-y-1">
                            <button
                              type="button"
                              disabled={busyMemberId === uid}
                              onClick={() => handleMarkMemberOrderPaid(m, unpaidOrder)}
                              className="px-2.5 py-1.5 rounded bg-amber-500/10 border border-amber-400/40 text-amber-300 hover:border-[var(--accent)] hover:text-[var(--accent)] inline-flex items-center gap-1 font-semibold"
                            >
                              <CheckCircle2 size={13} />
                              <span>Mark as Paid</span>
                            </button>
                            <p className="text-[11px] text-neutral-400 max-w-[240px] break-words">
                              {unpaidOrder.paymentMethod}
                            </p>
                          </div>
                        ) : paidOrder ? (
                          <span className="text-[var(--accent)] font-semibold uppercase">
                            Paid ({paidOrder.paymentProvider || 'cash'})
                          </span>
                        ) : m.membershipStatus === 'active' ? (
                          <span className="text-neutral-300">Active / Paid</span>
                        ) : (
                          <span className="text-neutral-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAssignMember(m);
                            setSelectedPkgId(packages[0]?.id || '');
                          }}
                          className="px-2.5 py-1.5 rounded bg-[#1C2024] border border-white/10 text-xs text-[var(--accent)] hover:border-[var(--accent)] inline-flex items-center gap-1"
                        >
                          <RefreshCw size={13} />
                          <span>Plan</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(m)}
                          aria-label={`Edit ${m.displayName}`}
                          className="p-2 rounded text-neutral-300 hover:text-white hover:bg-white/10 inline-flex"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(m)}
                          aria-label={`Delete ${m.displayName}`}
                          className="p-2 rounded text-red-400 hover:bg-red-500/10 inline-flex"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {filtered.map((m) => {
              const uid = m.id || m.uid;
              const payInfo = memberPaymentMap.get(uid);
              const unpaidOrder = payInfo?.unpaid;
              return (
                <div
                  key={uid}
                  className="p-4 rounded-lg bg-[#14171A] border border-white/10 space-y-2"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-semibold text-white">{m.displayName}</p>
                      <p className="text-xs text-neutral-400">
                        {m.email} &middot; Role: {m.role || 'member'}
                      </p>
                    </div>
                    <span className="text-xs uppercase font-semibold text-[var(--accent)]">
                      {m.membershipStatus}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300">
                    Plan: {m.planName || 'None'} &middot; Exp: {m.planExpiryDate || '—'}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {unpaidOrder ? (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleMarkMemberOrderPaid(m, unpaidOrder)}
                      >
                        Mark as Paid
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setAssignMember(m);
                        setSelectedPkgId(packages[0]?.id || '');
                      }}
                    >
                      Assign Plan
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleToggleRole(m)}>
                      Role
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(m)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(m)}>
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add / Edit Member Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={editingMemberId ? 'Edit Member' : 'Add Walk-In Member'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={form.displayName}
                onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Membership Status</label>
              <select
                value={form.membershipStatus}
                onChange={(e) =>
                  setForm((p) => ({ ...p, membershipStatus: e.target.value as MembershipStatus }))
                }
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              >
                <option value="none">None</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Plan Name</label>
              <input
                type="text"
                value={form.planName}
                onChange={(e) => setForm((p) => ({ ...p, planName: e.target.value }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Expiry Date (YYYY-MM-DD)</label>
              <input
                type="date"
                value={form.planExpiryDate}
                onChange={(e) => setForm((p) => ({ ...p, planExpiryDate: e.target.value }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Emergency Contact</label>
            <input
              type="text"
              value={form.emergencyContact}
              onChange={(e) => setForm((p) => ({ ...p, emergencyContact: e.target.value }))}
              className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save Member
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign / Renew Package Modal */}
      <Modal
        open={Boolean(assignMember)}
        onClose={() => setAssignMember(null)}
        title={`Assign Plan · ${assignMember?.displayName || ''}`}
      >
        <form onSubmit={handleAssignPackage} className="space-y-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Select Package</label>
            <select
              value={selectedPkgId}
              onChange={(e) => setSelectedPkgId(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
            >
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.billingCycle} ({p.durationDays} days)
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-neutral-400">
            Assigning sets membership status to Active starting today and calculates the new expiry
            date automatically.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setAssignMember(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Activate / Renew Plan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
