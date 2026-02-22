const Loader = ({ fullScreen = false, size = 'md' }) => {
  const sizes = {
    sm: 'h-8 w-8 border-2',
    md: 'h-12 w-12 border-3',
    lg: 'h-16 w-16 border-4'
  };

  const loader = (
    <div className={`animate-spin rounded-full ${sizes[size]} border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent`}></div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        {loader}
      </div>
    );
  }

  return <div className="flex items-center justify-center p-8">{loader}</div>;
};

export default Loader;
