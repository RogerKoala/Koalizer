import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Translations } from "../i18n";
import {
 CheckCircleIcon,
 ExclamationCircleIcon,
} from "@heroicons/react/24/solid";
import { XCircleIcon } from "@heroicons/react/24/outline";

interface ToastNotificationProps {
 message: string;
 show: boolean;
 onClose: () => void;
 t: Translations;
 onUndo?: () => void;
 showUndo?: boolean;
 type?: "success" | "error";
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
 message,
 show,
 onClose,
 t,
 onUndo,
 showUndo = false,
 type = "success",
}) => {
 const [isMounted, setIsMounted] = useState(false);

 useEffect(() => {
  setIsMounted(true);
 }, []);

 const handleUndo = () => {
  if (onUndo) {
   onUndo();
  }
  onClose();
 };

 const toastMarkup = (
  <div
   role="status"
   aria-live="polite"
   className={`fixed top-25 left-1/2 -translate-x-1/2 z-50 flex items-center w-full max-w-xs p-4 space-x-4 text-slate-600 bg-white rounded-lg shadow-lg dark:bg-slate-800 dark:text-slate-300 dark:divide-slate-700 space-x transition-all duration-300 ease-in-out
        ${
         show
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-full pointer-events-none"
        }`}
  >
   {type === "success" ? (
    <CheckCircleIcon className="size-10 fill-[#04ff00]" />
   ) : (
    <ExclamationCircleIcon className="size-10 fill-red-500" />
   )}

   <div className="flex-1">
    <div className="text-sm font-semibold">{message}</div>
    {showUndo && onUndo && (
     <button
      onClick={handleUndo}
      className="mt-2 text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 underline cursor-pointer"
     >
      {t.undoButton}
     </button>
    )}
   </div>
   <button
    onClick={onClose}
    aria-label={t.close}
    className="absolute top-1 right-1 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 inline-flex h-8 w-8 dark:text-slate-500 dark:hover:text-white dark:hover:bg-slate-700 items-center justify-center cursor-pointer"
   >
    <span className="sr-only">{t.close}</span>
    <XCircleIcon className="size-8" />
   </button>
  </div>
 );

 return isMounted ? createPortal(toastMarkup, document.body) : null;
};

export default ToastNotification;
