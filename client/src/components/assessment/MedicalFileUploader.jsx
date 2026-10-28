const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ".pdf,.jpg,.jpeg,.png,.webp";

export default function MedicalFileUploader({ files, onChange, disabled = false }) {
  const handleSelection = (event) => {
    const selected = Array.from(event.target.files || []);
    onChange((current) => [...current, ...selected].slice(0, 5));
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
                {file.size > MAX_FILE_SIZE && (
                  <span className="ml-2 text-rose-700">File exceeds 8 MB</span>
                )}
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
    </section>
  );
}
