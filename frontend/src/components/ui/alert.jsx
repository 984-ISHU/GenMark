import React from 'react';
import clsx from 'clsx';

const alertStyles = {
  success: 'bg-green-100 text-green-800 border-green-300',
  error: 'bg-red-100 text-red-800 border-red-300',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  info: 'bg-blue-100 text-blue-800 border-blue-300',
};

const Alert = ({ type = 'info', children, className }) => {
  return (
    <div
      className={clsx(
        'w-full p-4 rounded-md border text-sm space-y-1',
        alertStyles[type],
        className
      )}
    >
      {children}
    </div>
  );
};

const AlertDescription = ({ children }) => (
  <p className="text-sm text-gray-700">{children}</p>
);

export { Alert, AlertDescription };
