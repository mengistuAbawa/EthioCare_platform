export default function OcrVerificationPanel({ status = "disabled" }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-semibold text-slate-900">Document text extraction</h3>
      <p className="mt-1 text-sm text-slate-600">
        {status === "disabled"
          ? "OCR is disabled. Uploaded documents are stored securely and are not sent to an OCR provider."
          : `Document processing status: ${status}. Always verify values against the original document.`}
      </p>
    </section>
  );
}
