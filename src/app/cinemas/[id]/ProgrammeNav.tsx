"use client";

import { useRouter } from "next/navigation";
import DayPicker from "@/components/DayPicker";

interface Props {
  cinemaId: string;
  currentDate?: string; // "YYYY-MM-DD"
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ProgrammeNav({ cinemaId, currentDate }: Props) {
  const router = useRouter();
  const today = toIso(new Date());
  const active = currentDate ?? today;

  const handleSelect = (iso: string) => {
    if (iso === today) {
      router.push(`/cinemas/${cinemaId}`);
    } else {
      router.push(`/cinemas/${cinemaId}?date=${iso}`);
    }
  };

  return (
    <DayPicker
      currentDate={active}
      onSelect={handleSelect}
      count={30}
      className="mb-2"
    />
  );
}
