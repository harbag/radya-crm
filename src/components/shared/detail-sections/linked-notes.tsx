"use client";

import React, { useState } from "react";
import type { Note, EntityType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

export default function LinkedNotes({
  notes,
  onAdd,
}: {
  notes: Note[];
  onAdd?: (content: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [newNote, setNewNote] = useState("");

  function handleSubmit() {
    if (!newNote.trim() || !onAdd) return;
    onAdd(newNote.trim());
    setNewNote("");
    setShowForm(false);
  }

  return (
    <div className="space-y-3">
      {onAdd && (
        <div>
          {showForm ? (
            <div className="space-y-2">
              <Textarea
                placeholder="Write a note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="min-h-[80px] text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSubmit} className="text-xs">
                  Save Note
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowForm(false);
                    setNewNote("");
                  }}
                  className="text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForm(true)}
              className="gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Note
            </Button>
          )}
        </div>
      )}

      {notes.length === 0 && !showForm && (
        <p className="py-8 text-center text-sm text-zinc-400">No notes yet</p>
      )}

      {notes.map((note) => (
        <div
          key={note.id}
          className="rounded-lg border border-zinc-100 p-3"
        >
          <p className="text-sm text-zinc-700 whitespace-pre-wrap">
            {note.content}
          </p>
          <p className="mt-2 text-xs text-zinc-400">
            {new Date(note.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      ))}
    </div>
  );
}
