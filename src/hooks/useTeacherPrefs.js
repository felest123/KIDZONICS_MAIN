import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { DEFAULT_PREFS } from "@/lib/format";

const PREF_KEYS = [
  "theme",
  "font_size",
  "high_contrast",
  "dyslexic_font",
  "language",
  "timezone",
  "date_format",
  "time_format",
];

function pick(record) {
  const out = {};
  PREF_KEYS.forEach((key) => {
    if (record?.[key] !== undefined && record?.[key] !== null) out[key] = record[key];
  });
  return out;
}

export default function useTeacherPrefs(teacher) {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [prefId, setPrefId] = useState(null);

  useEffect(() => {
    if (!teacher?.email) return undefined;
    let active = true;
    (async () => {
      const page = await base44.entities.TeacherPreference.filter(
        { teacher_email: teacher.email },
        { limit: 1 }
      ).catch(() => null);
      const record = page?.items?.[0];
      if (!active || !record) return;
      setPrefId(record.id);
      setPrefs((current) => ({ ...current, ...pick(record) }));
    })();
    return () => {
      active = false;
    };
  }, [teacher?.email]);

  const save = async (patch) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    if (prefId) {
      await base44.entities.TeacherPreference.update(prefId, next).catch(() => {});
      return;
    }
    const created = await base44.entities.TeacherPreference.create({
      ...next,
      teacher_email: teacher?.email || "",
    }).catch(() => null);
    if (created?.id) setPrefId(created.id);
  };

  return { prefs, save };
}
