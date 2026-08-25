import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ProgressBar } from '@/components/ui/ProgressBar';

const budgetData = [
  { dept: 'Agriculture', allocated: 2800000, spent: 1920000 },
  { dept: 'Health', allocated: 1500000, spent: 980000 },
  { dept: 'Education', allocated: 2000000, spent: 1650000 },
  { dept: 'Infrastructure', allocated: 3500000, spent: 2100000 },
  { dept: 'Social Welfare', allocated: 1200000, spent: 750000 },
];

const totalAllocated = budgetData.reduce((s, b) => s + b.allocated, 0);
const totalSpent = budgetData.reduce((s, b) => s + b.spent, 0);

export default function BudgetManagement() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: 'Budgets' }]} />
      
      <div>
        <h1 className="text-2xl font-bold">Budget Management</h1>
        <p className="text-sm text-earth-500">Track budget allocation and expenditure across departments.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5 text-center">
            <DollarSign className="mx-auto mb-2 text-polli-600" size={24} />
            <p className="text-xs text-earth-500 uppercase tracking-wide">Total Budget</p>
            <p className="text-2xl font-bold text-earth-900 mt-1">৳{(totalAllocated / 1_000_000).toFixed(1)}M</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <TrendingUp className="mx-auto mb-2 text-amber-600" size={24} />
            <p className="text-xs text-earth-500 uppercase tracking-wide">Total Spent</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">৳{(totalSpent / 1_000_000).toFixed(1)}M</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <TrendingDown className="mx-auto mb-2 text-green-600" size={24} />
            <p className="text-xs text-earth-500 uppercase tracking-wide">Remaining</p>
            <p className="text-2xl font-bold text-green-600 mt-1">৳{((totalAllocated - totalSpent) / 1_000_000).toFixed(1)}M</p>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Department Budgets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {budgetData.map((b) => {
              const pct = Math.round((b.spent / b.allocated) * 100);
              return (
                <div key={b.dept}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-semibold text-earth-800">{b.dept}</span>
                    <span className="text-earth-500">৳{(b.spent / 1_000_000).toFixed(1)}M / ৳{(b.allocated / 1_000_000).toFixed(1)}M</span>
                  </div>
                  <ProgressBar value={pct} size="sm" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
