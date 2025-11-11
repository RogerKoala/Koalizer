import React from "react";
import { Durations } from "../types";
import { Translations } from "../i18n";
import { ClockIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

interface SummaryStatsProps {
 durations: Durations;
 t: Translations;
}

const StatCard: React.FC<{
 label: string;
 value: string | number;
 icon: React.ReactNode;
}> = ({ label, value, icon }) => (
 <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg flex items-start">
  <div className="bg-white dark:bg-slate-700 p-2 rounded-full mr-4 text-sky-600">
   {icon}
  </div>
  <div>
   <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
   <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
    {value}
   </p>
  </div>
 </div>
);

const formatSeconds = (seconds: number) => {
 const totalSeconds = Math.floor(seconds);
 const hours = Math.floor(totalSeconds / 3600);
 const minutes = Math.floor((totalSeconds % 3600) / 60);
 const remainingSeconds = totalSeconds % 60;

 const paddedHours = hours.toString().padStart(2, "0");
 const paddedMinutes = minutes.toString().padStart(2, "0");
 const paddedSeconds = remainingSeconds.toString().padStart(2, "0");

 return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
};

const SummaryStats: React.FC<SummaryStatsProps> = ({ durations, t }) => {
 return (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
   <StatCard
    label={t.audioDuration}
    value={durations.total_time || formatSeconds(durations.total_seconds)}
    icon={
     <ClockIcon className="size-8 transition-transform duration-300 stroke-2" />
    }
   />
   <StatCard
    label={t.totalWords}
    value={durations.total_words}
    icon={
     <DocumentTextIcon className="size-8 transition-transform duration-300 stroke-2" />
    }
   />
  </div>
 );
};

export default SummaryStats;
