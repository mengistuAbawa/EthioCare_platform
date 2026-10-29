import { useEffect, useRef, useState } from "react";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ".pdf,.jpg,.jpeg,.png,.webp";
const ACCEPTED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

function LocalImagePreview({ file }) {
  const imageRef = useRef(null);

  useEffect(() => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    if (imageRef.current) imageRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!file.type.startsWith("image/")) return null;
  return <img ref={imageRef} alt={`Local preview of ${file.name}`} className="mt-2 max-h-40 rounded-lg border border-slate-200 object-contain" />;
}

export default function MedicalFileUploader({ files, onChange, disabled = false }) {
  const [selectionError, setSelectionError] = useState("");
  const handleSelection = (event) => {
    const selected = Array.from(event.target.files || []);
    const invalidFile = selected.find((file) => !ACCEPTED_MIME_TYPES.has(file.type) || file.size < 1 || file.size > MAX_FILE_SIZE);
    if (invalidFile) {
      setSelectionError(`${invalidFile.name} is not a supported file or exceeds the 8 MB size limit.`);
      event.target.value = "";
      return;
    }
    if (files.length + selected.length > 5) {
      setSelectionError("An assessment can include no more than 5 files.");
      event.target.value = "";
      return;
    }
    setSelectionError("");
    onChange((current) => [...current, ...selected]);
    event.target.value = "";
  };

  const removeFile = (index) => {
    onChange((current) => current.filter((_, fileIndex) => fileIndex !== index));
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-slate-900">Medical files</h2>
      <p className="mt-1 text-sm text-slate-600">
        Add up to 5 PDF or image files. Each file must be 8 MB or smaller.
      </p>
      <input
        type="file"
        accept={ACCEPTED_TYPES}
        multiple
        disabled={disabled || files.length >= 5}
        onChange={handleSelection}
        className="mt-4 block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:font-semibold file:text-teal-800"
      />
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.lastModified}-${index}`}
              className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm"
            >
              <span className="min-w-0 truncate text-slate-700">
                {file.name} ({Math.ceil(file.size / 1024)} KB)
                <LocalImagePreview file={file} />
              </span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeFile(index)}
                className="shrink-0 font-semibold text-rose-700 disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {selectionError && <p role="alert" className="mt-3 text-sm text-rose-700">{selectionError}</p>}
    </section>
  );
}
