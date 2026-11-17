/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/admin/AdminDashboardPage.tsx
 * Purpose: Admin KPI overview (total members, active vs expired, today's check-ins,
 *          new orders, unread messages) plus one-click sample catalog seeder.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Database } from 'lucide-react';
import { getAllMembersAdmin } from '../../services/membersService';
import { getAllAttendanceAdmin } from '../../services/attendanceService';
import { getAllOrdersAdmin } from '../../services/shopService';
import { getAllMessagesAdmin } from '../../services/contactService';
import { seedInitialData } from '../../utils/seedData.js';
import { useSite } from '../../context/SiteContext';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';

interface DashboardMetrics {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  todayCheckIns: number;
  pendingOrders: number;
  unreadMessages: number;
}

export default function AdminDashboardPage() {
  const { showToast } = useSite();
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalMembers: 0,
    activeMembers: 0,
    expiredMembers: 0,
    todayCheckIns: 0,
    pendingOrders: 0,
    unreadMessages: 0,
  });

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const [members, attendance, orders, messages] = await Promise.all([
        getAllMembersAdmin(200),
        getAllAttendanceAdmin(200),
        getAllOrdersAdmin(100),
        getAllMessagesAdmin(100),
      ]);

      const todayStr = new Date().toISOString().split('T')[0];
      const todayCheckIns = attendance.filter((rec) => {
        if (!rec.checkInTime) return false;
        const ts = rec.checkInTime as { toDate?: () => Date };
        const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(String(rec.checkInTime));
        return !Number.isNaN(d.getTime()) && d.toISOString().split('T')[0] === todayStr;
      }).length;

      setMetrics({
        totalMembers: members.length,
        activeMembers: members.filter((m) => m.membershipStatus === 'active').length,
        expiredMembers: members.filter((m) => m.membershipStatus === 'expired').length,
        todayCheckIns,
        pendingOrders: orders.filter((o) => o.status === 'pending').length,
        unreadMessages: messages.filter((m) => !m.read).length,
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to load dashboard stats.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedInitialData(true);
      showToast('Sample packages, classes, trainers, products, posts, gallery, and events seeded to Firestore.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to seed sample data.', 'error');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) return <Loader label="Loading club overview..." />;

  const kpis = [
    { label: 'Total Members', value: metrics.totalMembers, sub: `${metrics.activeMembers} active · ${metrics.expiredMembers} expired`, to: '/admin/members' },
    { label: 'Active Plans', value: metrics.activeMembers, sub: 'Currently valid memberships', to: '/admin/members' },
    { label: "Today's Check-Ins", value: metrics.todayCheckIns, sub: 'Front-desk scans today', to: '/admin/attendance' },
    { label: 'New / Pending Orders', value: metrics.pendingOrders, sub: 'Shop & membership orders', to: '/admin/shop' },
    { label: 'Unread Messages', value: metrics.unreadMessages, sub: 'Inbound contact inquiries', to: '/admin/messages' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold uppercase text-white">
            Club Dashboard
          </h1>
          <p className="text-sm text-neutral-400">
            Real-time membership, attendance, order, and inquiry telemetry.
          </p>
        </div>

        <Button variant="secondary" loading={seeding} onClick={handleSeed}>
          <Database size={16} />
          <span>Seed Sample Catalog</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            to={kpi.to}
            className="p-6 rounded-lg bg-[#14171A] border border-white/10 hover:border-[var(--accent)] transition-colors space-y-2"
          >
            <p className="text-xs font-medium text-neutral-400">{kpi.label}</p>
            <p className="font-mono text-4xl font-bold tabular-nums text-[var(--accent)]">
              {kpi.value}
            </p>
            <p className="text-xs text-neutral-500">{kpi.sub}</p>
          </Link>
        ))}
      </div>

      <div className="p-6 rounded-lg bg-[#14171A] border border-white/10 space-y-3">
        <h2 className="font-display text-2xl font-bold uppercase text-white">
          Quick Operations
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/attendance"
            className="min-h-[42px] px-4 inline-flex items-center rounded text-xs font-semibold uppercase tracking-wider"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }}
          >
            Check In Member
          </Link>
          <Link
            to="/admin/members"
            className="min-h-[42px] px-4 inline-flex items-center rounded bg-[#1C2024] border border-white/15 text-xs font-semibold uppercase tracking-wider text-white hover:border-[var(--accent)]"
          >
            Manage Members
          </Link>
          <Link
            to="/admin/settings"
            className="min-h-[42px] px-4 inline-flex items-center rounded bg-[#1C2024] border border-white/15 text-xs font-semibold uppercase tracking-wider text-white hover:border-[var(--accent)]"
          >
            Edit Gym Branding
          </Link>
        </div>
      </div>
    </div>
  );
}
