function TabNavigation({ items, currentPath, onChange }) {
  return (
    <div className="tabs-row">
      {items.map((item) => (
        <button
          key={item.path}
          type="button"
          className={`tab-button${currentPath === item.path ? ' active' : ''}`}
          onClick={() => onChange(item.path)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export default TabNavigation;
