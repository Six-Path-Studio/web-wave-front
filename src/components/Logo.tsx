
import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center">
      <svg className="w-10 h-10 text-sixpath-green" viewBox="0 0 100 100" fill="currentColor">
        <path d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 90c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-17.9 40-40 40z" />
        <path d="M60 20H40v20l-17.3 10 17.3 10v20h20V60l17.3-10L60 40V20z" />
      </svg>
      <span className="ml-2 text-xl font-bold uppercase tracking-wider text-white">Sixpath Studio</span>
    </div>
  );
};

export default Logo;
