import HeaderDashboard from "../components/dashboard/header";
import WeekProgress from "../components/dashboard/weekProgressCard";
import MuscleGroupsCards from "../components/dashboard/muscleGroupGrid";
import RecentActivity from "../components/dashboard/recentActivity";
import { useState } from "react";

export default function DashboardPage() {
  const [weekActive, setWeekActive] = useState<boolean>(false);
  return (
    <div className="pb-24 bg-zinc-900 min-h-screen">
      <HeaderDashboard />
      <WeekProgress weekActive={weekActive} setWeekActive={setWeekActive} />
      <MuscleGroupsCards weekActive={weekActive} />
      <RecentActivity />
    </div>
  );
}
