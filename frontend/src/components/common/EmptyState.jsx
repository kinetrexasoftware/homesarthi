const EmptyState = ({ icon, title, description, action }) => {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">{icon || '📭'}</div>
      <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;