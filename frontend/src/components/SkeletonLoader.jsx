import { motion } from 'framer-motion';

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, idx) => (
        <tr key={idx} className="border-b border-gray-200">
          <td className="px-8 py-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </td>
          <td className="px-8 py-5">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          </td>
          <td className="px-8 py-5">
            <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
          </td>
          <td className="px-8 py-5">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </td>
          <td className="px-8 py-5 text-right flex justify-end">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </td>
          <td className="px-8 py-5" />
        </tr>
      ))}
    </>
  );
};

export const StatCardSkeleton = () => {
  return (
    <div className="backdrop-blur-md bg-white/60 p-6 rounded-xl border border-gray-200 shadow-lg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
      <div className="flex items-start justify-between">
        <div className="space-y-4 w-full">
          <div className="w-12 h-12 bg-gray-200 rounded-2xl animate-pulse" />
          <div className="space-y-3">
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};
