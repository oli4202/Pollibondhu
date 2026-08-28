import { useEffect, useState } from 'react';
import api from '@/utils/api';
import { DollarSign, TrendingUp, TrendingDown, Loader2, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ProgressBar } from '@/components/ui/ProgressBar';

export default function BudgetManagement() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/budgets')
      .then(res => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: 'Budgets' }]} />
        <div className="flex justify-center p-16"><Loader2 className="animate-spin text-polli-500" size={32} /></div>
      </div>
    );
  }

  const totals = data?.totals || { totalAllocated: 0, totalSpent: 0, totalRemaining: 0 };
  const budgetData: any[] = data?.budgetData || [];

  const formatMoney = (v: number) => {
    if (v >= 1_000_000) return `৳${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `৳${(v / 1_000).toFixed(0)}K`;
    return `৳${v.toLocaleString()}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Breadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: 'Budgets' }]} />
      
      <div>
        <h1 className="text-2xl font-bold text-earth-900">Budget Management</h1>
        <p className="text-sm text-earth-500">Track budget allocation and expenditure across departments.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-none shadow-lg shadow-blue-100/50 bg-gradient-to-br from-white to-blue-50/30">
          <CardContent className="p-5 text-center">
            <DollarSign className="mx-auto mb-2 text-polli-600" size={24} />
            <p className="text-xs text-earth-500 uppercase tracking-wide font-bold">Total Budget</p>
            <p className="text-2xl font-black text-earth-900 mt-1">{formatMoney(totals.totalAllocated)}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg shadow-amber-100/50 bg-gradient-to-br from-white to-amber-50/30">
          <CardContent className="p-5 text-center">
            <TrendingUp className="mx-auto mb-2 text-amber-600" size={24} />
            <p className="text-xs text-earth-500 uppercase tracking-wide font-bold">Total Spent</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{formatMoney(totals.totalSpent)}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg shadow-green-100/50 bg-gradient-to-br from-white to-green-50/30">
          <CardContent className="p-5 text-center">
            <TrendingDown className="mx-auto mb-2 text-green-600" size={24} />
            <p className="text-xs text-earth-500 uppercase tracking-wide font-bold">Remaining</p>
            <p className="text-2xl font-black text-green-600 mt-1">{formatMoney(totals.totalRemaining)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 size={18} className="text-polli-600" /> Department Budgets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {budgetData.length === 0 ? (
            <div className="p-8 text-center text-earth-400">
              <p className="text-lg font-bold">No budget data</p>
              <p className="text-sm mt-1">Create projects under departments to see budget breakdowns.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {budgetData.map((b: any) => {
                const pct = b.allocated > 0 ? Math.round((b.spent / b.allocated) * 100) : 0;
                return (
                  <div key={b.department_id}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-earth-800">{b.department}</span>
                        <span className="text-xs text-earth-400">({b.projectCount} projects, {b.completedCount} done)</span>
                      </div>
                      <span className="text-earth-500 font-medium">
                        {formatMoney(b.spent)} / {formatMoney(b.allocated)}
                      </span>
                    </div>
                    <ProgressBar value={pct} size="sm" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
