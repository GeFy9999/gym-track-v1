import { useState } from "react";
import { API_URL } from "../lib/api";
import type { ExerciseNote } from "../types/session";

export function useExerciseNotes() {
  const [exerciseNotes, setExerciseNotes] = useState<ExerciseNote[]>([]);
  const [noteModalFor, setNoteModalFor] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const getNote = (exerciseId: string) =>
    exerciseNotes.find((n) => n.exerciseId === exerciseId)?.note ?? "";

  const fetchExerciseNotes = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/exercise-notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setExerciseNotes(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const openNoteModal = (exerciseId: string) => {
    setNoteDraft(getNote(exerciseId));
    setNoteModalFor(exerciseId);
  };

  const closeNoteModal = () => setNoteModalFor(null);

  const saveNote = async () => {
    if (!noteModalFor) return;
    const exerciseId = noteModalFor;
    const note = noteDraft.trim();

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await fetch(`${API_URL}/exercise-notes`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ exerciseId, note }),
      });
      setExerciseNotes((prev) => {
        const withoutCurrent = prev.filter((n) => n.exerciseId !== exerciseId);
        return note
          ? [...withoutCurrent, { id: exerciseId, exerciseId, note }]
          : withoutCurrent;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setNoteModalFor(null);
    }
  };

  return {
    noteModalFor,
    noteDraft,
    setNoteDraft,
    getNote,
    fetchExerciseNotes,
    openNoteModal,
    closeNoteModal,
    saveNote,
  };
}
