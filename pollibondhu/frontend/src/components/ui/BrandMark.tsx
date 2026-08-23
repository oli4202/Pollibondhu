import { Sprout } from 'lucide-react';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <div className="inline-flex items-center gap-3">
    <span className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-polli-500 to-polli-800 text-white shadow-lg shadow-polli-800/20">
      <span className="absolute -bottom-2 h-6 w-10 rounded-full bg-amber-300/35" />
      <Sprout size={24} className="relative" strokeWidth={2.4} />
    </span>
    {!compact && <span><span className="block text-lg font-bold leading-5 text-earth-900">PolliBondhu</span><span className="block text-xs font-medium text-polli-700">পল্লীবন্ধু</span></span>}
  </div>;
}
