import { useTranslation } from "react-i18next";

type Props = {
  plates: number[];
  remainder: number;
  totalWeight: number;
  unit: string;
};

const MIN_SIZE = 22;
const MAX_SIZE = 34;

export default function PlateRow({
  plates,
  remainder,
  totalWeight,
  unit,
}: Props) {
  const { t } = useTranslation();
  if (plates.length === 0 && remainder <= 0) return null;

  const maxPlate = plates.length > 0 ? Math.max(...plates) : 1;

  return (
    <div className="flex items-center gap-2 flex-wrap pl-9">
      <span className="text-[11px] text-gray-400 flex-shrink-0">
        {t("session.perSide")}
      </span>
      <div className="flex items-center gap-1 flex-wrap">
        {plates.map((p, i) => {
          const size = MIN_SIZE + (p / maxPlate) * (MAX_SIZE - MIN_SIZE);
          return (
            <div
              key={i}
              className="rounded-full border-2 border-[#c9552c] bg-[#c9552c]/10 flex items-center justify-center font-bold text-[#c9552c] flex-shrink-0"
              style={{ width: size, height: size, fontSize: size > 28 ? 10 : 9 }}
            >
              {p}
            </div>
          );
        })}
        {remainder > 0 && (
          <span className="text-[10px] text-gray-400">
            {t("session.notCalculable", { count: remainder })}
          </span>
        )}
      </div>
      <span className="text-xs font-bold text-[#c9552c] ml-auto flex-shrink-0">
        {t("session.total", { weight: totalWeight, unit })}
      </span>
    </div>
  );
}
