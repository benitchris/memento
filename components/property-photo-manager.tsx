'use client';

import React, { useRef, useState } from 'react';
import { PropertyImage } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/data/service';
import { createClient } from '@/lib/supabase/client';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  UploadCloud,
} from 'lucide-react';

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_EDGE = 1600;
const OUTPUT_QUALITY = 0.82;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

interface PropertyPhotoManagerProps {
  images: PropertyImage[];
  onChange: (images: PropertyImage[]) => void;
  ownerId?: string | null;
  maxPhotos?: number;
  compact?: boolean;
  onBusyChange?: (busy: boolean) => void;
  disabled?: boolean;
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalise(images: PropertyImage[]): PropertyImage[] {
  const primaryIndex = images.findIndex((image) => image.is_primary);
  const chosenIndex = primaryIndex >= 0 ? primaryIndex : 0;

  return images.map((image, index) => ({
    ...image,
    property_id: image.property_id || '',
    display_order: index + 1,
    is_primary: index === chosenIndex,
  }));
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.readAsDataURL(blob);
  });
}

async function optimiseImage(file: File): Promise<Blob> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error(`${file.name} is not a supported image. Use JPG, PNG, WebP or AVIF.`);
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`${file.name} is larger than 8 MB.`);
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`${file.name} could not be opened. Try a JPG or PNG photo.`);
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const needsConversion = file.type === 'image/png' || file.type === 'image/avif';
    if (scale === 1 && file.size <= 900 * 1024 && !needsConversion) {
      return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const context = canvas.getContext('2d');
    if (!context) return file;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const compressed = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', OUTPUT_QUALITY);
    });

    return compressed && compressed.size < file.size ? compressed : file;
  } finally {
    bitmap.close?.();
  }
}

async function storePhoto(
  blob: Blob,
  ownerId: string | null | undefined
): Promise<{ url: string; cloud: boolean }> {
  if (isSupabaseConfigured() && ownerId) {
    try {
      const supabase = createClient();
      const extension =
        blob.type === 'image/png'
          ? 'png'
          : blob.type === 'image/webp'
          ? 'webp'
          : blob.type === 'image/avif'
          ? 'avif'
          : 'jpg';
      const path = `${ownerId}/${createId()}.${extension}`;
      const { error } = await supabase.storage.from('property-images').upload(path, blob, {
        contentType: blob.type || 'image/jpeg',
        cacheControl: '31536000',
        upsert: false,
      });

      if (!error) {
        const { data } = supabase.storage.from('property-images').getPublicUrl(path);
        if (data?.publicUrl) {
          return { url: data.publicUrl, cloud: true };
        }
      }
    } catch {
      // Fall through to a local preview so the host never loses their selection.
    }
  }

  return { url: await blobToDataUrl(blob), cloud: false };
}

export function PropertyPhotoManager({
  images,
  onChange,
  ownerId,
  maxPhotos = 8,
  compact = false,
  onBusyChange,
  disabled = false,
}: PropertyPhotoManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const setUploading = (value: boolean) => {
    setBusy(value);
    onBusyChange?.(value);
  };

  const handleFiles = async (fileList: FileList | File[] | null) => {
    if (!fileList || disabled || busy) return;

    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;

    const remaining = maxPhotos - images.length;
    if (remaining <= 0) {
      setError(`You can add up to ${maxPhotos} photos. Remove one to add another.`);
      return;
    }

    const queue = incoming.slice(0, remaining);
    setError(incoming.length > remaining ? `Only ${remaining} more photo(s) could be added.` : null);
    setWarning(null);
    setUploading(true);
    setProgress({ done: 0, total: queue.length });

    let next = [...images];
    let localOnly = 0;

    for (let index = 0; index < queue.length; index += 1) {
      const file = queue[index];

      try {
        const blob = await optimiseImage(file);
        const stored = await storePhoto(blob, ownerId);
        if (!stored.cloud) localOnly += 1;

        next = [
          ...next,
          {
            id: createId(),
            property_id: '',
            image_url: stored.url,
            caption: file.name.replace(/\.[^.]+$/, ''),
            display_order: next.length + 1,
            is_primary: next.length === 0,
          },
        ];
        onChange(normalise(next));
      } catch (uploadError) {
        setError(
          uploadError instanceof Error ? uploadError.message : 'That photo could not be added.'
        );
      }

      setProgress({ done: index + 1, total: queue.length });
    }

    if (localOnly > 0) {
      setWarning(
        'Some photos were saved on this device only. Enable the property-images storage bucket in Supabase to sync them everywhere.'
      );
    }

    setUploading(false);
  };

  const move = (from: number, direction: -1 | 1) => {
    const to = from + direction;
    if (to < 0 || to >= images.length) return;

    const next = [...images];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(normalise(next));
  };

  const makeCover = (index: number) => {
    const next = [...images];
    const [selected] = next.splice(index, 1);
    next.unshift({ ...selected, is_primary: true });
    onChange(normalise(next));
  };

  const remove = (index: number) => {
    onChange(normalise(images.filter((_, itemIndex) => itemIndex !== index)));
  };

  return (
    <div className="space-y-4">
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFiles(event.dataTransfer.files);
        }}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
          dragging
            ? 'border-[#b94726] bg-orange-50'
            : 'border-stone-300 bg-stone-50/60 hover:border-stone-400'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#b94726] shadow-sm">
          <UploadCloud className="h-6 w-6" />
        </span>
        <p className="mt-3 text-sm font-bold text-stone-900">
          Drag & drop your property photos
        </p>
        <p className="mt-1 text-[11px] text-stone-500">
          Bright, real photos of the rooms, exterior and views book faster.
        </p>

        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#b94726] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#9e3b1e] disabled:opacity-50"
        >
          <ImagePlus className="h-4 w-4" />
          <span>Choose photos</span>
        </button>

        <p className="mt-3 text-[10px] font-medium text-stone-400">
          {images.length}/{maxPhotos} added · JPG, PNG, WebP or AVIF · up to 8 MB each
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          multiple
          disabled={disabled || busy}
          onChange={(event) => {
            void handleFiles(event.target.files);
            event.target.value = '';
          }}
          className="hidden"
        />
      </div>

      {busy && (
        <div className="flex items-center gap-2 rounded-xl bg-stone-100 px-3 py-2 text-[11px] font-semibold text-stone-700">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#b94726]" />
          <span>
            Uploading and optimising {progress.done}/{progress.total || 1}…
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {warning && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{warning}</span>
        </div>
      )}

      {images.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Your photos ({images.length})
            </span>
            <span className="text-[10px] text-stone-400">
              First photo is the cover. Use arrows to reorder.
            </span>
          </div>

          <div
            className={`grid gap-3 ${
              compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
            }`}
          >
            {images.map((image, index) => (
              <div
                key={image.id}
                className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
              >
                <div className="aspect-[4/3] bg-stone-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.image_url}
                    alt={image.caption || `Property photo ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1 bg-gradient-to-b from-black/50 to-transparent p-2">
                  {image.is_primary ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-bold uppercase text-stone-900 shadow-sm">
                      <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                      Cover
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => makeCover(index)}
                      className="rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold text-stone-700 shadow-sm hover:bg-white"
                    >
                      Set cover
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-sm hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Remove photo ${index + 1}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-2 pb-2 pt-6 text-white">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 hover:bg-white/35 disabled:opacity-30"
                    aria-label="Move photo left"
                  >
                    <ArrowLeft className="h-3 w-3" />
                  </button>
                  <span className="text-[9px] font-bold">
                    {index + 1}/{images.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === images.length - 1}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 hover:bg-white/35 disabled:opacity-30"
                    aria-label="Move photo right"
                  >
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
