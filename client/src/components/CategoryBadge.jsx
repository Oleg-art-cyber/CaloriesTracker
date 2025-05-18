// client/src/components/CategoryBadge.jsx
export default function CategoryBadge({ name }) {
    if (!name) return null;
    return (
        <span className="ml-2 px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-xs">
      {name}
    </span>
    );
}
