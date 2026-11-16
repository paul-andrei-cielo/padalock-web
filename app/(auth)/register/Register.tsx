"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ---------- Types ---------- */

type Platform = "Shopee" | "TikTok Shop" | "Other";

interface Parcel {
  _id: string;
  trackingNumber: string;
  parcelName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deliveryDate?: string;
  retrievedDate?: string;
  // New fields (the API/schema needs to accept these)
  source?: Platform;
  sourceOther?: string;
  description?: string;
  dimensions?: { length: number; width: number; height: number }; // cm
  image?: string | null;
}

interface FormState {
  trackingNumber: string;
  parcelName: string;
  source: Platform;
  sourceOther: string;
  description: string;
  length: string;
  width: string;
  height: string;
  image: string | null;
}

/* ---------- Constants ---------- */

const API_BASE = "/api/parcels";

// "Register" was easy to confuse with creating an account, so this page is
// now "Parcels". The route stays /register.
const navItems = [
  { label: "Parcels", href: "/register" },
  { label: "Activity", href: "/activity" },
  { label: "Notifications", href: "/notifications" },
  { label: "Account", href: "/account" },
];

const platforms: Platform[] = ["Shopee", "TikTok Shop", "Other"];

const filterTabs = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "RETRIEVED", label: "Retrieved" },
];

// High-contrast chips that match the dashboard's status colors.
const statusStyles: Record<string, string> = {
  PENDING: "bg-[#ffc46b] text-[#5c2e00]",
  DELIVERED: "bg-white text-[#8a1a42]",
  RETRIEVED: "bg-[#7ee0b5] text-[#0b4a31]",
};

const emptyForm: FormState = {
  trackingNumber: "",
  parcelName: "",
  source: "Shopee",
  sourceOther: "",
  description: "",
  length: "",
  width: "",
  height: "",
  image: null,
};

const glass =
  "relative rounded-[2rem] border border-white/35 bg-[#a82452]/60 backdrop-blur-xl " +
  "shadow-[0_8px_32px_rgba(120,20,55,0.25),inset_0_1px_0_rgba(255,255,255,0.25)]";

const glassInner =
  "rounded-3xl border border-white/20 bg-white/[0.18] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8789b]";

// Pill-shaped text inputs.
const inputClass =
  "w-full h-12 rounded-full border border-white/35 bg-white/15 px-5 text-white placeholder:text-white/60 " +
  "outline-none transition focus:border-white/70 focus:bg-white/25 disabled:opacity-60";

// A full pill looks wrong on a multi-line box, so textareas get a softer curve.
const textareaClass = inputClass.replace("rounded-full", "rounded-3xl");

const scrollbarClass =
  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/30 [&::-webkit-scrollbar-thumb]:rounded-full";

/* ---------- Icons ---------- */

const iconPaths = {
  box: "M21 8l-9-5-9 5 9 5 9-5z M3 8v8l9 5 9-5V8 M12 13v8",
  search: "M11 4a7 7 0 100 14 7 7 0 000-14z M21 21l-4.3-4.3",
  close: "M6 6l12 12M18 6L6 18",
  image: "M3 5h18v14H3z M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z M21 15l-5-5L5 19",
  pencil: "M4 20h4L19 9l-4-4L4 16v4z",
  trash: "M4 7h16 M10 11v6 M14 11v6 M6 7l1 13h10l1-13 M9 7V4h6v3",
  plus: "M12 5v14M5 12h14",
  chevron: "M9 6l6 6-6 6",
  return: "M9 14l-5-5 5-5 M4 9h11a5 5 0 010 10h-3",
  check: "M5 12.5l4.5 4.5L19 7",
} as const;

function Icon({
  name,
  size = 20,
}: {
  name: keyof typeof iconPaths;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}

/* ---------- Helpers ---------- */

const formatDate = (dateString?: string | null): string => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const statusLabel = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

const sourceLabel = (p: Parcel) =>
  p.source === "Other" && p.sourceOther ? p.sourceOther : p.source || "—";

const dimsLabel = (p: Parcel) =>
  p.dimensions
    ? `${p.dimensions.length} × ${p.dimensions.width} × ${p.dimensions.height} cm`
    : "Not provided";

const formFromParcel = (p: Parcel): FormState => ({
  trackingNumber: p.trackingNumber,
  parcelName: p.parcelName === "Parcel" ? "" : p.parcelName,
  source: p.source || "Other",
  sourceOther: p.sourceOther || "",
  description: p.description || "",
  length: p.dimensions ? String(p.dimensions.length) : "",
  width: p.dimensions ? String(p.dimensions.width) : "",
  height: p.dimensions ? String(p.dimensions.height) : "",
  image: p.image || null,
});

function validateForm(f: FormState): string | null {
  if (!f.trackingNumber.trim()) return "Enter a tracking number.";
  const dims = [f.length, f.width, f.height];
  const filled = dims.filter((d) => d.trim() !== "").length;
  if (filled > 0 && filled < 3)
    return "Fill in length, width and height, or leave all three empty.";
  if (filled === 3 && dims.some((d) => !(parseFloat(d) > 0)))
    return "Dimensions must be greater than 0.";
  return null;
}

function buildPayload(f: FormState) {
  const hasDims = f.length && f.width && f.height;
  return {
    trackingNumber: f.trackingNumber.trim(),
    parcelName: f.parcelName.trim() || "Parcel",
    source: f.source,
    sourceOther: f.source === "Other" ? f.sourceOther.trim() : "",
    description: f.description.trim(),
    dimensions: hasDims
      ? {
          length: parseFloat(f.length),
          width: parseFloat(f.width),
          height: parseFloat(f.height),
        }
      : null,
    image: f.image,
  };
}

// Resizes a photo in the browser so uploads stay small.
function fileToResizedDataUrl(file: File, maxSize = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/"))
      return reject(new Error("Choose an image file (JPG, PNG or WebP)."));
    if (file.size > 8 * 1024 * 1024)
      return reject(new Error("That photo is over 8 MB. Choose a smaller one."));

    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error("Couldn't process that photo."));
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that photo."));
    };
    img.src = url;
  });
}

const authHeaders = (json = false): HeadersInit => {
  const token = localStorage.getItem("token")!;
  return json
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { Authorization: `Bearer ${token}` };
};

/* ---------- Shared pieces ---------- */

function StatusChip({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-bold ${
        statusStyles[status.toUpperCase()] || "bg-white text-[#8a1a42]"
      }`}
    >
      {statusLabel(status)}
    </span>
  );
}

function Label({
  htmlFor,
  children,
  optional,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-semibold text-white"
    >
      {children}
      {optional && (
        <span className="ml-1.5 font-normal text-white/80">(optional)</span>
      )}
    </label>
  );
}

/* ---------- Form fields (used by "Add a parcel" and the edit modal) ---------- */

function ParcelFields({
  value,
  onChange,
  disabled,
  idPrefix,
  onError,
  wide = false,
}: {
  value: FormState;
  onChange: React.Dispatch<React.SetStateAction<FormState>>;
  disabled?: boolean;
  idPrefix: string;
  onError: (msg: string) => void;
  wide?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const set = <K extends keyof FormState>(key: K, v: FormState[K]) =>
    onChange((prev) => ({ ...prev, [key]: v }));

  const setDim = (key: "length" | "width" | "height", raw: string) =>
    set(
      key,
      raw
        .replace(/[^0-9.]/g, "")
        .replace(/(\..*)\./g, "$1")
        .slice(0, 6)
    );

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    try {
      set("image", await fileToResizedDataUrl(file));
      onError("");
    } catch (e: any) {
      onError(e.message || "Couldn't read that photo.");
    }
  };

  const pair = wide ? "grid gap-4 sm:grid-cols-2" : "grid gap-4";

  return (
    <div className="space-y-5">
      {/* Parcel info */}
      <div className={pair}>
        <div>
          <Label htmlFor={`${idPrefix}-tracking`}>Tracking number</Label>
          <input
            id={`${idPrefix}-tracking`}
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            placeholder="e.g. SPXPH0123456789"
            className={`${inputClass} font-semibold tracking-wide`}
            value={value.trackingNumber}
            onChange={(e) =>
              set(
                "trackingNumber",
                e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 40)
              )
            }
            disabled={disabled}
            required
            autoComplete="off"
            aria-describedby={`${idPrefix}-tracking-hint`}
          />
          <p
            id={`${idPrefix}-tracking-hint`}
            className="mt-1.5 text-xs text-white/80"
          >
            Letters and numbers only. Spaces and dashes are removed.
          </p>
        </div>

        <div>
          <Label htmlFor={`${idPrefix}-name`} optional>
            Parcel name
          </Label>
          <input
            id={`${idPrefix}-name`}
            type="text"
            placeholder="e.g. Birthday gift"
            className={inputClass}
            value={value.parcelName}
            onChange={(e) => set("parcelName", e.target.value.slice(0, 60))}
            disabled={disabled}
            autoComplete="off"
          />
        </div>
      </div>

      {/* Source */}
      <div>
        <p className="mb-1.5 text-sm font-semibold text-white" id={`${idPrefix}-source`}>
          Where is it from?
        </p>
        <div
          role="radiogroup"
          aria-labelledby={`${idPrefix}-source`}
          className="grid grid-cols-3 gap-2"
        >
          {platforms.map((p) => {
            const active = value.source === p;
            return (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={disabled}
                onClick={() => set("source", p)}
                className={`h-11 rounded-full border text-sm font-semibold transition ${focusRing} ${
                  active
                    ? "border-white bg-white text-[#8a1a42] shadow-md"
                    : "border-white/35 bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
        {value.source === "Other" && (
          <input
            type="text"
            aria-label="Platform or store name"
            placeholder="Which platform or store?"
            className={`${inputClass} mt-3`}
            value={value.sourceOther}
            onChange={(e) => set("sourceOther", e.target.value.slice(0, 40))}
            disabled={disabled}
            autoComplete="off"
          />
        )}
      </div>

      {/* Details */}
      <div>
        <Label htmlFor={`${idPrefix}-desc`} optional>
          Description
        </Label>
        <textarea
          id={`${idPrefix}-desc`}
          rows={2}
          maxLength={200}
          placeholder="What's inside? Anything to remember about it?"
          className={`${textareaClass} h-auto resize-none py-3`}
          value={value.description}
          onChange={(e) => set("description", e.target.value)}
          disabled={disabled}
        />
      </div>

      <div>
        <p className="mb-1.5 text-sm font-semibold text-white">
          Dimensions in cm
          <span className="ml-1.5 font-normal text-white/80">(optional)</span>
        </p>
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              ["length", "Length"],
              ["width", "Width"],
              ["height", "Height"],
            ] as const
          ).map(([key, label]) => (
            <input
              key={key}
              type="text"
              inputMode="decimal"
              aria-label={`${label} in centimeters`}
              placeholder={label}
              className={`${inputClass} px-3 text-center`}
              value={value[key]}
              onChange={(e) => setDim(key, e.target.value)}
              disabled={disabled}
              autoComplete="off"
            />
          ))}
        </div>
      </div>

      {/* Photo */}
      <div>
        <p className="mb-1.5 text-sm font-semibold text-white">
          Photo
          <span className="ml-1.5 font-normal text-white/80">(optional)</span>
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {value.image ? (
          <div className="relative overflow-hidden rounded-2xl border border-white/35">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.image}
              alt="Parcel preview"
              className="h-36 w-full object-cover"
            />
            <div className="absolute right-2 top-2 flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={disabled}
                className={`rounded-full bg-[#7a1a3d]/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#7a1a3d] ${focusRing}`}
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => set("image", null)}
                disabled={disabled}
                aria-label="Remove photo"
                className={`flex h-8 w-8 items-center justify-center rounded-full bg-[#7a1a3d]/90 text-white hover:bg-[#7a1a3d] ${focusRing}`}
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            disabled={disabled}
            className={`flex h-28 w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed text-white transition ${focusRing} ${
              dragging
                ? "border-white bg-white/25"
                : "border-white/50 bg-white/10 hover:bg-white/20"
            }`}
          >
            <Icon name="image" size={24} />
            <span className="text-sm font-semibold">Add a photo</span>
            <span className="text-xs text-white/80">
              Tap to choose, or drop an image here
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- Details modal ---------- */

function ParcelModal({
  parcel,
  onClose,
  onSave,
  onDelete,
}: {
  parcel: Parcel;
  onClose: () => void;
  onSave: (id: string, form: FormState) => Promise<string | null>;
  onDelete: (id: string) => Promise<string | null>;
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [form, setForm] = useState<FormState>(() => formFromParcel(parcel));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const save = async () => {
    const problem = validateForm(form);
    if (problem) return setErr(problem);
    setBusy(true);
    const e = await onSave(parcel._id, form);
    setBusy(false);
    if (e) return setErr(e);
    setErr("");
    setMode("view");
  };

  const remove = async () => {
    setBusy(true);
    const e = await onDelete(parcel._id);
    if (e) {
      setBusy(false);
      setErr(e);
    }
    // On success the parent closes the modal.
  };

  const editing = mode === "edit";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#5c0f2e]/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="parcel-modal-title"
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-[2rem] border border-white/35 bg-[#7a1a3d]/90 shadow-2xl backdrop-blur-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 p-6 pb-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white/80">
              {editing ? "Editing parcel" : "Parcel details"}
            </p>
            <h2
              id="parcel-modal-title"
              className="break-all text-xl font-bold text-white"
            >
              {parcel.trackingNumber}
            </h2>
            <div className="mt-2">
              <StatusChip status={parcel.status} />
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white hover:bg-white/25 ${focusRing}`}
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={`flex-1 overflow-y-auto px-6 pb-2 ${scrollbarClass}`}>
          {editing ? (
            <ParcelFields
              value={form}
              onChange={setForm}
              disabled={busy}
              idPrefix="edit"
              onError={setErr}
              wide
            />
          ) : (
            <div className="space-y-4">
              {parcel.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={parcel.image}
                  alt={`Photo of ${parcel.parcelName}`}
                  className="h-48 w-full rounded-2xl border border-white/30 object-cover"
                />
              )}

              <dl className={`${glassInner} grid grid-cols-2 gap-x-4 gap-y-4 p-4`}>
                <Detail label="Parcel name" value={parcel.parcelName} />
                <Detail label="Source" value={sourceLabel(parcel)} />
                <Detail label="Dimensions" value={dimsLabel(parcel)} wide />
                <Detail
                  label="Description"
                  value={parcel.description || "No description"}
                  wide
                />
              </dl>

              <dl className={`${glassInner} grid grid-cols-3 gap-3 p-4`}>
                <Detail label="Registered" value={formatDate(parcel.createdAt)} />
                <Detail label="Delivered" value={formatDate(parcel.deliveryDate)} />
                <Detail label="Retrieved" value={formatDate(parcel.retrievedDate)} />
              </dl>
            </div>
          )}

          {err && (
            <div
              role="alert"
              className="mt-4 rounded-2xl border border-white/30 bg-[#5c0f2e]/70 p-3 text-sm font-medium text-white"
            >
              {err}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 p-6 pt-4">
          {editing ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setForm(formFromParcel(parcel));
                  setErr("");
                  setMode("view");
                }}
                className={`h-11 rounded-full border border-white/40 bg-white/15 px-5 text-sm font-semibold text-white hover:bg-white/25 disabled:opacity-60 ${focusRing}`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={save}
                className={`h-11 rounded-full bg-white px-6 text-sm font-bold text-[#8a1a42] shadow-md hover:bg-pink-50 disabled:opacity-60 ${focusRing}`}
              >
                {busy ? "Saving…" : "Save changes"}
              </button>
            </>
          ) : confirmDelete ? (
            <>
              <p className="mr-auto text-sm font-semibold text-white">
                Delete this parcel?
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmDelete(false)}
                className={`h-11 rounded-full border border-white/40 bg-white/15 px-5 text-sm font-semibold text-white hover:bg-white/25 ${focusRing}`}
              >
                Keep it
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={remove}
                className={`h-11 rounded-full bg-[#5c0f2e] px-5 text-sm font-bold text-white hover:bg-[#4a0b25] disabled:opacity-60 ${focusRing}`}
              >
                {busy ? "Deleting…" : "Delete"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className={`mr-auto flex h-11 items-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 text-sm font-semibold text-white hover:bg-white/20 ${focusRing}`}
              >
                <Icon name="trash" size={16} />
                Delete
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm(formFromParcel(parcel));
                  setMode("edit");
                }}
                className={`flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-[#8a1a42] shadow-md hover:bg-pink-50 ${focusRing}`}
              >
                <Icon name="pencil" size={16} />
                Edit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="text-xs font-semibold text-white/80">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-semibold text-white">
        {value}
      </dd>
    </div>
  );
}

/* ---------- Returns ---------- */

const RETURNS_API = "/api/returns";
const MAX_RETURN_PARCELS = 5;

interface ReturnRecord {
  _id: string;
  parcelCount?: number;
  items?: string[];
  itemDescription?: string;
  otp: string | null;
  otpExpiry: string | null;
  status: string;
  createdAt: string;
  pickedUpDate?: string;
}

// Returns use the sky-blue family (accent bar, icon) so they never get mixed
// up with deliveries. Status chips keep their own meaning on top of that.
const RETURN_ACCENT = "#8ecbff";

const returnStatusConfig: Record<
  string,
  { label: string; hint: string; chip: string }
> = {
  PENDING: {
    label: "Pending",
    hint: "Generate an OTP when you're ready for pickup",
    chip: "bg-[#ffc46b] text-[#5c2e00]",
  },
  READY_FOR_PICKUP: {
    label: "Ready for pickup",
    hint: "Waiting for the rider",
    chip: "border border-[#8ecbff] bg-[#8ecbff]/25 text-white",
  },
  OTP_ACTIVE: {
    label: "OTP active",
    hint: "Give the code to the rider",
    chip: "bg-[#8ecbff] text-[#0b3a5c]",
  },
  PICKED_UP: {
    label: "Picked up",
    hint: "The rider collected this return",
    chip: "bg-[#7ee0b5] text-[#0b4a31]",
  },
  EXPIRED: {
    label: "OTP expired",
    hint: "Generate a new OTP to continue",
    chip: "border border-white/40 bg-[#5c0f2e] text-white",
  },
  CANCELLED: {
    label: "Cancelled",
    hint: "This return was cancelled",
    chip: "border border-white/40 bg-white/25 text-white",
  },
};

type ReturnFilter = "ALL" | "PENDING" | "OTP_ACTIVE" | "PICKED_UP" | "EXPIRED";

const returnFilterTabs: { key: ReturnFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "OTP_ACTIVE", label: "OTP active" },
  { key: "PICKED_UP", label: "Picked up" },
  { key: "EXPIRED", label: "Expired" },
];

const isOtpExpired = (expiry?: string | null) =>
  !!expiry && new Date(expiry).getTime() < Date.now();

// An active OTP that has run out counts as expired.
const effectiveStatus = (r: ReturnRecord) =>
  r.status === "OTP_ACTIVE" && isOtpExpired(r.otpExpiry) ? "EXPIRED" : r.status;

// Which filter tab a return belongs to (cancelled ones only show under All).
const filterKeyOf = (status: string): ReturnFilter | null =>
  status === "PENDING" || status === "READY_FOR_PICKUP"
    ? "PENDING"
    : status === "OTP_ACTIVE" || status === "PICKED_UP" || status === "EXPIRED"
    ? status
    : null;

// Statuses where the owner can still generate (or regenerate) an OTP.
const canGenerateOtp = (r: ReturnRecord) =>
  ["READY_FOR_PICKUP", "OTP_ACTIVE", "EXPIRED"].includes(r.status);

const returnItems = (r: ReturnRecord) =>
  r.items && r.items.length > 0 ? r.items : [r.itemDescription || "Parcel"];

const returnCount = (r: ReturnRecord) => r.parcelCount || returnItems(r).length;

const returnTitle = (r: ReturnRecord) => {
  const list = returnItems(r);
  return list.length === 1 ? list[0] : `${list[0]} +${list.length - 1} more`;
};

const parcelCountLabel = (n: number) => `${n} ${n === 1 ? "parcel" : "parcels"}`;

const formatDateTime = (s?: string | null) => {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";
  return `${formatDate(s)} at ${d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
};

function ReturnChip({ status }: { status: string }) {
  const cfg = returnStatusConfig[status] || {
    label: status,
    hint: "",
    chip: "bg-white text-[#8a1a42]",
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${cfg.chip}`}
    >
      {status === "PICKED_UP" && <Icon name="check" size={12} />}
      {cfg.label}
    </span>
  );
}

function ReturnModal({
  record,
  initialReveal,
  onClose,
  onGenerateOtp,
  onDelete,
}: {
  record: ReturnRecord;
  initialReveal: boolean;
  onClose: () => void;
  onGenerateOtp: (id: string) => Promise<string | null>;
  onDelete: (id: string) => Promise<string | null>;
}) {
  const [showOtp, setShowOtp] = useState(initialReveal);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);

  const status = effectiveStatus(record);
  const otpActive = record.status === "OTP_ACTIVE" && status !== "EXPIRED" && !!record.otp;
  const list = returnItems(record);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const generate = async () => {
    setBusy(true);
    setErr("");
    const e = await onGenerateOtp(record._id);
    setBusy(false);
    if (e) return setErr(e);
    setShowOtp(true);
  };

  const remove = async () => {
    setBusy(true);
    const e = await onDelete(record._id);
    if (e) {
      setBusy(false);
      setErr(e);
    }
    // On success the parent closes the modal.
  };

  const copyOtp = async () => {
    if (!record.otp) return;
    try {
      await navigator.clipboard.writeText(record.otp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErr("Couldn't copy. Read the code out to the rider instead.");
    }
  };

  // Steps: Registered → OTP issued → Picked up
  const otpIssued = !!record.otp || ["OTP_ACTIVE", "PICKED_UP", "EXPIRED"].includes(record.status);
  const steps = [
    { label: "Registered", done: true, note: formatDate(record.createdAt) },
    {
      label: "OTP issued",
      done: otpIssued,
      note: !otpIssued
        ? "—"
        : status === "EXPIRED"
        ? "Expired"
        : record.status === "PICKED_UP"
        ? "Used"
        : `Until ${formatDateTime(record.otpExpiry)}`,
    },
    {
      label: "Picked up",
      done: record.status === "PICKED_UP",
      note: record.status === "PICKED_UP" ? formatDate(record.pickedUpDate) : "—",
    },
  ];
  const currentStep = steps.filter((s) => s.done).length - 1;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#5c0f2e]/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="return-modal-title"
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-[2rem] border border-white/35 bg-[#7a1a3d]/90 shadow-2xl backdrop-blur-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 p-6 pb-4">
          <div className="min-w-0">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-[#8ecbff]">
              <Icon name="return" size={14} />
              Return · {parcelCountLabel(returnCount(record))}
            </p>
            <h2 id="return-modal-title" className="break-words text-xl font-bold text-white">
              {returnTitle(record)}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ReturnChip status={status} />
              <span className="text-xs font-medium text-white/90">
                {returnStatusConfig[status]?.hint}
              </span>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white hover:bg-white/25 ${focusRing}`}
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className={`flex-1 space-y-4 overflow-y-auto px-6 pb-2 ${scrollbarClass}`}>
          {record.status !== "CANCELLED" && (
            <ol className={`${glassInner} grid grid-cols-3 gap-2 p-4`}>
              {steps.map((s, i) => (
                <li
                  key={s.label}
                  aria-current={i === currentStep ? "step" : undefined}
                  className="flex flex-col items-center gap-1.5 text-center"
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold ${
                      s.done
                        ? "border-[#8ecbff] bg-[#8ecbff] text-[#0b3a5c]"
                        : "border-white/50 text-white/80"
                    }`}
                  >
                    {s.done ? <Icon name="check" size={16} /> : i + 1}
                  </span>
                  <span className="text-xs font-bold text-white">{s.label}</span>
                  <span className="text-xs text-white/90">{s.note}</span>
                </li>
              ))}
            </ol>
          )}

          <div className={`${glassInner} p-4`}>
            <p className="mb-2 text-xs font-semibold text-white/80">Items to return</p>
            <ul className="space-y-1.5">
              {list.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm font-semibold text-white">
                  <span className="text-white/80">{i + 1}.</span>
                  <span className="min-w-0 break-words">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-white/20 pt-3 text-xs text-white/90">
              Registered {formatDateTime(record.createdAt)}
            </p>
          </div>

          {/* OTP for the rider */}
          {canGenerateOtp(record) && (
            <div className={`${glassInner} p-4`}>
              <p className="text-sm font-bold text-white">Rider code (OTP)</p>
              {otpActive ? (
                <>
                  <p className="mt-0.5 text-xs text-white/90">
                    Give this code to the rider. Expires {formatDateTime(record.otpExpiry)}.
                  </p>
                  <p
                    className="my-3 select-all text-center text-4xl font-black tracking-[0.3em] text-white"
                    aria-live="polite"
                  >
                    {showOtp ? record.otp : "••••••"}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowOtp((v) => !v)}
                      className={`h-10 rounded-full border border-white/40 bg-white/15 px-4 text-sm font-semibold text-white hover:bg-white/25 ${focusRing}`}
                    >
                      {showOtp ? "Hide code" : "Show code"}
                    </button>
                    <button
                      type="button"
                      onClick={copyOtp}
                      className={`h-10 rounded-full border border-white/40 bg-white/15 px-4 text-sm font-semibold text-white hover:bg-white/25 ${focusRing}`}
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button
                      type="button"
                      onClick={generate}
                      disabled={busy}
                      className={`h-10 rounded-full border border-white/40 bg-white/15 px-4 text-sm font-semibold text-white hover:bg-white/25 disabled:opacity-60 ${focusRing}`}
                    >
                      {busy ? "Regenerating…" : "Regenerate"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mb-3 mt-0.5 text-xs text-white/90">
                    {status === "EXPIRED"
                      ? "The last code expired. Generate a new one for the rider."
                      : "Make sure the item is in your locker, then generate a code for the rider."}
                  </p>
                  <button
                    type="button"
                    onClick={generate}
                    disabled={busy}
                    className={`h-11 w-full rounded-full bg-white text-sm font-bold text-[#8a1a42] shadow-md hover:bg-pink-50 disabled:opacity-60 ${focusRing}`}
                  >
                    {busy ? "Generating…" : status === "EXPIRED" ? "Generate a new OTP" : "Generate OTP"}
                  </button>
                </>
              )}
            </div>
          )}

          {err && (
            <div
              role="alert"
              className="rounded-2xl border border-white/30 bg-[#5c0f2e]/70 p-3 text-sm font-medium text-white"
            >
              {err}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 p-6 pt-4">
          {confirmDelete ? (
            <>
              <p className="mr-auto text-sm font-semibold text-white">Delete this return?</p>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmDelete(false)}
                className={`h-11 rounded-full border border-white/40 bg-white/15 px-5 text-sm font-semibold text-white hover:bg-white/25 ${focusRing}`}
              >
                Keep it
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={remove}
                className={`h-11 rounded-full bg-[#5c0f2e] px-5 text-sm font-bold text-white hover:bg-[#4a0b25] disabled:opacity-60 ${focusRing}`}
              >
                {busy ? "Deleting…" : "Delete"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className={`mr-auto flex h-11 items-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 text-sm font-semibold text-white hover:bg-white/20 ${focusRing}`}
            >
              <Icon name="trash" size={16} />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReturnsSection({
  active,
  initialOpenId,
}: {
  active: boolean;
  initialOpenId: string | null;
}) {
  const [records, setRecords] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [actionError, setActionError] = useState("");

  const [parcelCount, setParcelCount] = useState(1);
  const [items, setItems] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const [filter, setFilter] = useState<ReturnFilter>("ALL");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revealFor, setRevealFor] = useState<string | null>(null);
  const [otpBusyId, setOtpBusyId] = useState<string | null>(null);
  const loadedRef = useRef(false);
  const openedRef = useRef(false);

  const fetchReturns = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(RETURNS_API, { headers: authHeaders() });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch returns");
      }
      const data = await res.json();
      setRecords(
        Array.isArray(data)
          ? [...data].sort(
              (a: ReturnRecord, b: ReturnRecord) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
          : []
      );
      setListError("");
    } catch (err: any) {
      console.error("Error fetching returns:", err);
      setListError(err.message || "Failed to load returns");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load lazily the first time the Returns tab is opened.
  useEffect(() => {
    if (active && !loadedRef.current) {
      loadedRef.current = true;
      fetchReturns();
    }
  }, [active, fetchReturns]);

  // Deep link from the Activity page: /register?tab=returns&id=...
  useEffect(() => {
    if (initialOpenId && !openedRef.current && records.some((r) => r._id === initialOpenId)) {
      openedRef.current = true;
      setSelectedId(initialOpenId);
    }
  }, [initialOpenId, records]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  const changeParcelCount = (count: number) => {
    setParcelCount(count);
    setItems((current) => Array.from({ length: count }, (_, i) => current[i] || ""));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length !== parcelCount || items.some((it) => !it.trim())) {
      setFormError("Describe every parcel you're returning.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch(RETURNS_API, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({
          parcelCount,
          items: items.map((it) => it.trim()),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create return");
      }
      setParcelCount(1);
      setItems([""]);
      setNotice("Return registered.");
      await fetchReturns();
    } catch (err: any) {
      console.error("Error creating return:", err);
      setFormError(err.message || "Failed to create return");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateOtp = useCallback(
    async (id: string): Promise<string | null> => {
      try {
        setOtpBusyId(id);
        const res = await fetch(`${RETURNS_API}/${id}`, {
          method: "PATCH",
          headers: authHeaders(true),
          body: JSON.stringify({ action: "generate_otp" }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to generate OTP");
        }
        await fetchReturns();
        return null;
      } catch (err: any) {
        console.error("Error generating OTP:", err);
        return err.message || "Failed to generate OTP";
      } finally {
        setOtpBusyId(null);
      }
    },
    [fetchReturns]
  );

  // Quick action from the list: generate, then open the code.
  const quickGenerate = async (id: string) => {
    setActionError("");
    const e = await handleGenerateOtp(id);
    if (e) return setActionError(e);
    setRevealFor(id);
    setSelectedId(id);
  };

  const handleDelete = useCallback(
    async (id: string): Promise<string | null> => {
      try {
        const res = await fetch(`${RETURNS_API}/${id}`, {
          method: "DELETE",
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error("Failed to delete return");
        setSelectedId(null);
        setNotice("Return deleted.");
        await fetchReturns();
        return null;
      } catch (err: any) {
        return err.message || "Failed to delete return";
      }
    },
    [fetchReturns]
  );

  const closeModal = useCallback(() => {
    setSelectedId(null);
    setRevealFor(null);
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: records.length };
    records.forEach((r) => {
      const k = filterKeyOf(effectiveStatus(r));
      if (k) c[k] = (c[k] || 0) + 1;
    });
    return c;
  }, [records]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (filter !== "ALL" && filterKeyOf(effectiveStatus(r)) !== filter) return false;
      if (!q) return true;
      return returnItems(r).some((it) => it.toLowerCase().includes(q));
    });
  }, [records, filter, search]);

  const selected = records.find((r) => r._id === selectedId) || null;

  const stepBtn = `h-11 w-11 rounded-full border border-white/35 bg-white/15 text-xl font-semibold text-white transition hover:bg-white/25 disabled:opacity-50 ${focusRing}`;

  return (
    <>
      <section
        className={`relative z-0 flex-1 flex-col gap-4 lg:min-h-0 lg:grid-cols-[1.5fr_1fr] lg:gap-5 ${
          active ? "flex lg:grid" : "hidden"
        }`}
      >
        {/* RETURNS LIST */}
        <div
          className={`${glass} order-2 flex min-h-[22rem] flex-col p-5 lg:order-1 lg:min-h-0 lg:p-6`}
        >
          <div className="shrink-0 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white">Your returns</h2>
              <p className="text-sm font-medium text-white/90">
                {filtered.length} of {records.length}
              </p>
            </div>

            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/80">
                <Icon name="search" size={18} />
              </span>
              <input
                type="search"
                aria-label="Search returns"
                placeholder="Search by item"
                className={`${inputClass} pl-11`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filter returns by status"
            >
              {returnFilterTabs.map((tab) => {
                const isActive = filter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setFilter(tab.key)}
                    className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${focusRing} ${
                      isActive
                        ? "border-white bg-white text-[#8a1a42] shadow-md"
                        : "border-white/35 bg-white/15 text-white hover:bg-white/25"
                    }`}
                  >
                    {tab.label}
                    <span className={isActive ? "text-[#8a1a42]/80" : "text-white/80"}>
                      {counts[tab.key] || 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {actionError && (
              <div
                role="alert"
                className="rounded-2xl border border-white/30 bg-[#5c0f2e]/70 p-3 text-sm font-medium text-white"
              >
                {actionError}
              </div>
            )}
          </div>

          <div
            className={`mt-4 max-h-[32rem] flex-1 overflow-y-auto pr-1 lg:max-h-none lg:min-h-0 ${scrollbarClass}`}
          >
            {listError ? (
              <div
                role="alert"
                className={`${glassInner} flex flex-col items-center gap-3 p-6 text-center`}
              >
                <p className="text-sm font-semibold text-white">{listError}</p>
                <button
                  type="button"
                  onClick={fetchReturns}
                  className={`rounded-full bg-white px-5 py-2 text-sm font-bold text-[#8a1a42] ${focusRing}`}
                >
                  Try again
                </button>
              </div>
            ) : loading && records.length === 0 ? (
              <p className="py-16 text-center text-sm font-semibold text-white">
                Loading returns…
              </p>
            ) : filtered.length > 0 ? (
              <ul className="flex flex-col gap-2.5">
                {filtered.map((r) => {
                  const status = effectiveStatus(r);
                  const otpActive = r.status === "OTP_ACTIVE" && status !== "EXPIRED";
                  const list = returnItems(r);
                  return (
                    <li
                      key={r._id}
                      className={`${glassInner} relative flex items-center gap-2 overflow-hidden transition-colors hover:bg-white/25`}
                    >
                      <span
                        className="absolute inset-y-0 left-0 w-1.5"
                        style={{ backgroundColor: RETURN_ACCENT }}
                        aria-hidden
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedId(r._id)}
                        aria-label={`View return: ${returnTitle(r)}`}
                        className={`flex min-w-0 flex-1 items-center gap-3 rounded-3xl p-3 pl-5 text-left ${focusRing}`}
                      >
                        <span
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#6b0f33]/55"
                          style={{ color: RETURN_ACCENT }}
                        >
                          <Icon name="return" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-base font-bold text-white">
                            {returnTitle(r)}
                          </span>
                          <span className="block truncate text-sm text-white/90">
                            {parcelCountLabel(returnCount(r))}
                            {list.length > 1 ? ` · ${list.slice(1).join(", ")}` : ""}
                          </span>
                          <span className="block text-xs text-white/80">
                            Registered {formatDate(r.createdAt)}
                            {r.status === "PICKED_UP" && r.pickedUpDate
                              ? ` · Picked up ${formatDate(r.pickedUpDate)}`
                              : ""}
                          </span>
                        </span>
                      </button>

                      <div className="flex shrink-0 flex-col items-end gap-2 py-3 pr-3">
                        <ReturnChip status={status} />
                        {canGenerateOtp(r) &&
                          (otpActive ? (
                            <button
                              type="button"
                              onClick={() => {
                                setRevealFor(r._id);
                                setSelectedId(r._id);
                              }}
                              className={`rounded-full border border-white/40 bg-white/15 px-3 py-1 text-xs font-bold text-white hover:bg-white hover:text-[#8a1a42] ${focusRing}`}
                            >
                              View OTP
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => quickGenerate(r._id)}
                              disabled={otpBusyId === r._id}
                              className={`rounded-full bg-white px-3 py-1 text-xs font-bold text-[#8a1a42] shadow-md hover:bg-pink-50 disabled:opacity-60 ${focusRing}`}
                            >
                              {otpBusyId === r._id
                                ? "Generating…"
                                : status === "EXPIRED"
                                ? "New OTP"
                                : "Get OTP"}
                            </button>
                          ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                <p className="text-sm font-semibold text-white">
                  {records.length === 0 ? "No returns yet" : "No returns match your filters"}
                </p>
                <p className="mt-1 max-w-xs text-xs text-white/80">
                  {records.length === 0
                    ? "Register a return using the form."
                    : "Try a different search or status."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* REGISTER A RETURN */}
        <div className={`${glass} order-1 flex flex-col p-5 lg:order-2 lg:min-h-0 lg:p-6`}>
          <div className="mb-4 flex shrink-0 items-center justify-between">
            <h2 className="text-lg font-bold text-white">Register a return</h2>
            {notice && (
              <p
                role="status"
                className="rounded-full bg-[#8ecbff] px-3 py-1 text-xs font-bold text-[#0b3a5c]"
              >
                {notice}
              </p>
            )}
          </div>

          <form onSubmit={handleCreate} className="flex flex-col lg:min-h-0 lg:flex-1">
            <div className={`space-y-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1 ${scrollbarClass}`}>
              <ol className={`${glassInner} grid grid-cols-3 gap-2 p-3 text-center`}>
                {["Register your return", "Place it in your locker", "Give the rider an OTP"].map(
                  (label, i) => (
                    <li key={label} className="flex flex-col items-center gap-1.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8ecbff] text-xs font-bold text-[#0b3a5c]">
                        {i + 1}
                      </span>
                      <span className="text-xs font-semibold text-white">{label}</span>
                    </li>
                  )
                )}
              </ol>

              <div>
                <p className="mb-1.5 text-sm font-semibold text-white">Number of parcels</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label="Fewer parcels"
                    disabled={submitting || parcelCount <= 1}
                    onClick={() => changeParcelCount(parcelCount - 1)}
                    className={stepBtn}
                  >
                    −
                  </button>
                  <span
                    className="min-w-[2ch] text-center text-lg font-bold text-white"
                    aria-live="polite"
                  >
                    {parcelCount}
                  </span>
                  <button
                    type="button"
                    aria-label="More parcels"
                    disabled={submitting || parcelCount >= MAX_RETURN_PARCELS}
                    onClick={() => changeParcelCount(parcelCount + 1)}
                    className={stepBtn}
                  >
                    +
                  </button>
                  <span className="text-xs text-white/80">Up to {MAX_RETURN_PARCELS}</span>
                </div>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index}>
                    <Label htmlFor={`return-item-${index}`}>
                      Parcel {index + 1} description
                    </Label>
                    <input
                      id={`return-item-${index}`}
                      type="text"
                      placeholder={index === 0 ? "e.g. Birthday gift" : "e.g. Shampoo"}
                      className={inputClass}
                      value={item}
                      onChange={(e) => {
                        const next = [...items];
                        next[index] = e.target.value.slice(0, 100);
                        setItems(next);
                      }}
                      disabled={submitting}
                      required
                      autoComplete="off"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 shrink-0 space-y-3">
              {formError && (
                <div
                  role="alert"
                  className="rounded-2xl border border-white/30 bg-[#5c0f2e]/70 p-3 text-sm font-medium text-white"
                >
                  {formError}
                </div>
              )}
              <button
                type="submit"
                disabled={submitting || items.some((it) => !it.trim())}
                className={`flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-base font-bold text-[#8a1a42] shadow-lg transition hover:bg-pink-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
              >
                <Icon name="return" size={18} />
                {submitting ? "Registering…" : "Register return"}
              </button>
            </div>
          </form>
        </div>
      </section>

      {selected && (
        <ReturnModal
          key={selected._id}
          record={selected}
          initialReveal={revealFor === selected._id}
          onClose={closeModal}
          onGenerateOtp={handleGenerateOtp}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}

/* ---------- Page ---------- */

export default function ParcelsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [listError, setListError] = useState("");

  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Deliveries and returns live on one page, switched with tabs.
  // Deep link: /register?tab=returns (&id=... opens a return).
  const [section, setSection] = useState<"DELIVERIES" | "RETURNS">("DELIVERIES");
  const [initialReturnId, setInitialReturnId] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("tab") === "returns") setSection("RETURNS");
    setInitialReturnId(p.get("id"));
  }, []);

  const switchSection = (next: "DELIVERIES" | "RETURNS") => {
    setSection(next);
    window.history.replaceState(null, "", next === "RETURNS" ? "/register?tab=returns" : "/register");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      window.location.href = "/login";
      return;
    }
    setIsAuthenticated(true);
  }, []);

  const fetchParcels = useCallback(async () => {
    try {
      setDataLoading(true);
      const res = await fetch(API_BASE, { headers: authHeaders() });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch parcels");
      }
      const data = await res.json();
      setParcels(
        Array.isArray(data)
          ? [...data].sort(
              (a: Parcel, b: Parcel) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
          : []
      );
      setListError("");
    } catch (err: any) {
      console.error("Error fetching parcels:", err);
      setListError(err.message || "Failed to load parcels");
      setParcels([]);
    } finally {
      setDataLoading(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated === true) fetchParcels();
  }, [isAuthenticated, fetchParcels]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  /* ----- Actions ----- */

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateForm(form);
    if (problem) return setFormError(problem);

    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify(buildPayload(form)),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add parcel");
      }
      setForm(emptyForm);
      setNotice("Parcel added.");
      await fetchParcels();
    } catch (err: any) {
      console.error("Error adding parcel:", err);
      setFormError(err.message || "Failed to add parcel");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = useCallback(
    async (id: string, f: FormState): Promise<string | null> => {
      try {
        const payload = buildPayload(f);
        const res = await fetch(`${API_BASE}/${id}`, {
          method: "PUT",
          headers: authHeaders(true),
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to update parcel");
        }
        setParcels((prev) =>
          prev.map((p) =>
            p._id === id
              ? {
                  ...p,
                  ...payload,
                  dimensions: payload.dimensions ?? undefined,
                  source: payload.source,
                }
              : p
          )
        );
        setNotice("Changes saved.");
        return null;
      } catch (err: any) {
        console.error("Error updating parcel:", err);
        return err.message || "Failed to update parcel";
      }
    },
    []
  );

  const handleDelete = useCallback(
    async (id: string): Promise<string | null> => {
      try {
        const res = await fetch(`${API_BASE}/${id}`, {
          method: "DELETE",
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error("Failed to delete parcel");
        setSelectedId(null);
        setNotice("Parcel deleted.");
        await fetchParcels();
        return null;
      } catch (err: any) {
        console.error("Delete error:", err);
        return err.message || "Failed to delete parcel";
      }
    },
    [fetchParcels]
  );

  const closeModal = useCallback(() => setSelectedId(null), []);

  /* ----- Derived ----- */

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: parcels.length };
    parcels.forEach((p) => {
      const k = p.status.toUpperCase();
      c[k] = (c[k] || 0) + 1;
    });
    return c;
  }, [parcels]);

  const filteredParcels = useMemo(() => {
    const q = search.trim().toLowerCase();
    return parcels.filter((p) => {
      if (activeFilter !== "ALL" && p.status.toUpperCase() !== activeFilter)
        return false;
      if (!q) return true;
      return [p.trackingNumber, p.parcelName, sourceLabel(p), p.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [parcels, activeFilter, search]);

  const selectedParcel = parcels.find((p) => p._id === selectedId) || null;

  /* ----- Early states ----- */

  const pageBg =
    "bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.28),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.35),transparent_50%),linear-gradient(180deg,#df4473_0%,#e8789b_50%,#ee94ae_100%)]";

  if (isAuthenticated === null) {
    return (
      <main className={`flex h-screen items-center justify-center ${pageBg}`}>
        <p className="animate-pulse text-xl font-extrabold text-white">
          Checking authentication…
        </p>
      </main>
    );
  }

  if (isAuthenticated === false) {
    return (
      <main className={`flex h-screen items-center justify-center p-4 ${pageBg}`}>
        <div className="text-center">
          <p className="mb-3 text-2xl font-extrabold text-white md:text-3xl">
            You're not logged in
          </p>
          <p className="text-lg font-semibold text-white">
            Redirecting to login…
          </p>
        </div>
      </main>
    );
  }

  if (initialLoading) {
    return (
      <main className={`flex min-h-screen items-center justify-center ${pageBg}`}>
        <div
          role="status"
          aria-label="Loading parcels"
          className="h-16 w-16 animate-spin rounded-full border-[5px] border-white/30 border-t-white"
        />
      </main>
    );
  }

  /* ----- Render ----- */

  return (
    <main
      className={`flex min-h-screen flex-col p-4 md:p-6 lg:h-screen lg:overflow-hidden lg:p-8 ${pageBg}`}
    >
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 lg:min-h-0 lg:gap-5">
        {/* HEADER */}
        <header className={`${glass} z-[100] shrink-0 !rounded-2xl px-4 py-3 md:px-6`}>
          <div className="flex items-center justify-between">
            <Link href="/home" className={`rounded-lg ${focusRing}`}>
              <Image
                src="/padalock-logo.png"
                alt="Padalock home"
                width={200}
                height={50}
                className="w-28 md:w-40"
                priority
              />
            </Link>

            <nav className="hidden gap-8 font-semibold text-white lg:flex">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={item.href === "/register" ? "page" : undefined}
                  className={`group relative rounded py-1 ${focusRing}`}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-0.5 left-0 h-0.5 bg-white transition-all duration-300 ${
                      item.href === "/register"
                        ? "w-full"
                        : "w-0 group-hover:w-full group-focus-visible:w-full"
                    }`}
                  />
                </Link>
              ))}
            </nav>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`relative z-[110] rounded-lg p-2 lg:hidden ${focusRing}`}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              <div className="flex h-4 w-6 flex-col justify-between">
                <span
                  className={`h-0.5 w-full origin-left rounded-full bg-white transition-all duration-300 ${
                    isMenuOpen ? "rotate-45" : ""
                  }`}
                />
                <span
                  className={`h-0.5 w-full rounded-full bg-white transition-all duration-300 ${
                    isMenuOpen ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`h-0.5 w-full origin-left rounded-full bg-white transition-all duration-300 ${
                    isMenuOpen ? "-rotate-45" : ""
                  }`}
                />
              </div>
            </button>
          </div>

          <div
            className={`absolute left-0 right-0 top-full mt-3 px-2 transition-all duration-300 ease-out lg:hidden ${
              isMenuOpen
                ? "pointer-events-auto translate-y-0 opacity-100"
                : "pointer-events-none -translate-y-4 opacity-0"
            }`}
          >
            <nav className="flex flex-col overflow-hidden rounded-2xl border border-white/40 bg-white/95 p-2 shadow-2xl backdrop-blur-2xl">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-xl p-4 font-semibold text-[#b02a58] transition-colors hover:bg-pink-50"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {/* SECTION SWITCH */}
        <div
          role="tablist"
          aria-label="Parcels section"
          className="flex shrink-0 gap-1 self-start rounded-full border border-white/30 bg-white/10 p-1"
        >
          {(
            [
              ["DELIVERIES", "Deliveries", "box"],
              ["RETURNS", "Returns", "return"],
            ] as const
          ).map(([key, label, icon]) => (
            <button
              key={key}
              role="tab"
              aria-selected={section === key}
              onClick={() => switchSection(key)}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${focusRing} ${
                section === key
                  ? "bg-white text-[#8a1a42] shadow-md"
                  : "text-white hover:bg-white/15"
              }`}
            >
              <Icon name={icon} size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* DELIVERIES */}
        <section
          className={`relative z-0 flex-1 flex-col gap-4 lg:min-h-0 lg:grid-cols-[1.5fr_1fr] lg:gap-5 ${
            section === "DELIVERIES" ? "flex lg:grid" : "hidden"
          }`}
        >
          {/* LIST */}
          <div
            className={`${glass} order-2 flex min-h-[22rem] flex-col p-5 lg:order-1 lg:min-h-0 lg:p-6`}
          >
            <div className="shrink-0 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-white">Your parcels</h2>
                <p className="text-sm font-medium text-white/90">
                  {filteredParcels.length} of {parcels.length}
                </p>
              </div>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/80">
                  <Icon name="search" size={18} />
                </span>
                <input
                  type="search"
                  aria-label="Search parcels"
                  placeholder="Search by tracking number, name or source"
                  className={`${inputClass} pl-11`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div
                role="tablist"
                aria-label="Filter by status"
                className="grid grid-cols-4 gap-1 rounded-full border border-white/20 bg-white/10 p-1"
              >
                {filterTabs.map((tab) => {
                  const active = activeFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveFilter(tab.key)}
                      className={`rounded-full px-1 py-2 text-xs font-semibold transition sm:text-sm ${focusRing} ${
                        active
                          ? "bg-white text-[#8a1a42] shadow-md"
                          : "text-white hover:bg-white/15"
                      }`}
                    >
                      {tab.label}
                      <span className={`ml-1 ${active ? "" : "text-white/80"}`}>
                        {counts[tab.key] || 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className={`mt-4 max-h-[32rem] flex-1 overflow-y-auto pr-1 lg:max-h-none lg:min-h-0 ${scrollbarClass}`}
            >
              {listError ? (
                <div
                  role="alert"
                  className={`${glassInner} flex flex-col items-center gap-3 p-6 text-center`}
                >
                  <p className="text-sm font-semibold text-white">{listError}</p>
                  <button
                    type="button"
                    onClick={fetchParcels}
                    className={`rounded-full bg-white px-5 py-2 text-sm font-bold text-[#8a1a42] ${focusRing}`}
                  >
                    Try again
                  </button>
                </div>
              ) : dataLoading && parcels.length === 0 ? (
                <p className="py-16 text-center text-sm font-semibold text-white">
                  Loading parcels…
                </p>
              ) : filteredParcels.length > 0 ? (
                <ul className="flex flex-col gap-2.5">
                  {filteredParcels.map((parcel) => (
                    <li key={parcel._id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(parcel._id)}
                        aria-label={`View details for ${parcel.trackingNumber}`}
                        className={`${glassInner} group flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-white/30 ${focusRing}`}
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#6b0f33]/50 text-white">
                          {parcel.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={parcel.image}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Icon name="box" />
                          )}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-base font-bold text-white">
                            {parcel.trackingNumber}
                          </span>
                          <span className="block truncate text-sm text-white/90">
                            {parcel.parcelName}
                            {parcel.source ? ` · ${sourceLabel(parcel)}` : ""}
                          </span>
                          <span className="block text-xs text-white/80">
                            Added {formatDate(parcel.createdAt)}
                          </span>
                        </span>

                        <StatusChip status={parcel.status} />
                        <span className="hidden text-white/80 transition-transform group-hover:translate-x-0.5 sm:block">
                          <Icon name="chevron" size={18} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                  <p className="text-sm font-semibold text-white">
                    {parcels.length === 0
                      ? "No parcels yet"
                      : "No parcels match your filters"}
                  </p>
                  <p className="mt-1 max-w-xs text-xs text-white/80">
                    {parcels.length === 0
                      ? "Add your first parcel using the form."
                      : "Try a different search or status."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ADD FORM */}
          <div
            className={`${glass} order-1 flex flex-col p-5 lg:order-2 lg:min-h-0 lg:p-6`}
          >
            <div className="mb-4 flex shrink-0 items-center justify-between">
              <h2 className="text-lg font-bold text-white">Add a parcel</h2>
              {notice && (
                <p
                  role="status"
                  className="rounded-full bg-[#7ee0b5] px-3 py-1 text-xs font-bold text-[#0b4a31]"
                >
                  {notice}
                </p>
              )}
            </div>

            <form
              onSubmit={handleRegister}
              className="flex flex-col lg:min-h-0 lg:flex-1"
            >
              <div
                className={`lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1 ${scrollbarClass}`}
              >
                <ParcelFields
                  value={form}
                  onChange={setForm}
                  disabled={submitting}
                  idPrefix="add"
                  onError={setFormError}
                />
              </div>

              <div className="mt-5 shrink-0 space-y-3">
                {formError && (
                  <div
                    role="alert"
                    className="rounded-2xl border border-white/30 bg-[#5c0f2e]/70 p-3 text-sm font-medium text-white"
                  >
                    {formError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting || !form.trackingNumber.trim()}
                  className={`flex h-13 w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-base font-bold text-[#8a1a42] shadow-lg transition hover:bg-pink-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
                >
                  <Icon name="plus" size={18} />
                  {submitting ? "Adding…" : "Add parcel"}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* RETURNS (stays mounted so a half-filled form isn't lost on tab switch) */}
        <ReturnsSection active={section === "RETURNS"} initialOpenId={initialReturnId} />
      </div>

      {selectedParcel && (
        <ParcelModal
          key={selectedParcel._id}
          parcel={selectedParcel}
          onClose={closeModal}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </main>
  );
}