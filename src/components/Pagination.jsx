// Reusable pager footer used by every paginated admin table.
export default function Pagination({ page, totalPages, total, onChange }) {
  if (totalPages <= 1) {
    return (
      <div className="flex justify-between items-center mt-3 text-xs opacity-70">
        <span>{total} total</span>
      </div>
    );
  }

  function go(p) {
    onChange(Math.max(1, Math.min(totalPages, p)));
  }

  return (
    <div className="flex justify-between items-center mt-3 text-xs">
      <span className="opacity-70">{total} total · page {page} of {totalPages}</span>
      <div className="flex gap-1">
        <PageBtn onClick={() => go(1)} disabled={page === 1}>« First</PageBtn>
        <PageBtn onClick={() => go(page - 1)} disabled={page === 1}>‹ Prev</PageBtn>
        <PageBtn onClick={() => go(page + 1)} disabled={page === totalPages}>Next ›</PageBtn>
        <PageBtn onClick={() => go(totalPages)} disabled={page === totalPages}>Last »</PageBtn>
      </div>
    </div>
  );
}

function PageBtn({ children, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}
