'use client';

import React from 'react';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white group-[.toaster]:text-[#2C2825] group-[.toaster]:border-[#E5E0D8] group-[.toaster]:shadow-lg rounded-2xl',
          description: 'group-[.toast]:text-[#8A847C]',
          actionButton:
            'group-[.toast]:bg-[#D4AF37] group-[.toast]:text-white',
          cancelButton:
            'group-[.toast]:bg-[#FAF9F6] group-[.toast]:text-[#5C5855]',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
