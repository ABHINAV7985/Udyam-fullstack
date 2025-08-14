
import React from 'react';
type Props = { step: number; total: number; titles: string[] };
const Progress: React.FC<Props> = ({ step, total, titles }) => {
  const percent = Math.round(((step + 1) / total) * 100);
  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between mb-2 text-sm">
        <div className="font-medium">Progress</div>
        <div>{percent}%</div>
      </div>
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div className="h-2 bg-black" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:text-sm">
        {titles.map((t, i) => (
          <div key={i} className={`flex items-center gap-2 ${i <= step ? '' : 'text-gray-500'}`}>
            <span className="inline-block h-2 w-2 rounded-full bg-black" />
            <span className="truncate">{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Progress;
