export default function HeaderDashboard() {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const capitalizedDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const userName = "Alex";
  const streak = 0;

  return (
    <div className="flex justify-between items-center px-4 pt-5 pb-4">
      <div>
        <p className="text-sm text-zinc-400 mb-0.5">{capitalizedDate}</p>
        <p className="text-2xl font-bold text-white">Bonjour, {userName}</p>
      </div>
      <div className="flex items-center gap-1.5 bg-orange-500/15 border border-orange-500/30 px-3 py-1.5 rounded-full">
        <span className="text-base">🔥</span>
        <span className="text-sm font-semibold text-orange-400">{streak}</span>
      </div>
    </div>
  );
}
