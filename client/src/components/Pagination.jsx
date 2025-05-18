// client/src/components/Pagination.jsx
export default function Pagination({ page, total, limit, onPage }) {
    const pages = Math.ceil(total / limit);
    if (pages <= 1) return null;          // ничего не рисуем, если всего одна страница

    return (
        <div className="flex justify-center gap-3 mt-6">
            <button
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-40"
                disabled={page === 1}
                onClick={() => onPage(page - 1)}
            >
                ←
            </button>

            <span className="self-center text-sm">
        {page} / {pages}
      </span>

            <button
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-40"
                disabled={page === pages}
                onClick={() => onPage(page + 1)}
            >
                →
            </button>
        </div>
    );
}
