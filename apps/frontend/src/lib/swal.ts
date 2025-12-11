/**
 * SweetAlert2 Utility with Professional Theme Styling
 * Pre-configured Swal instances that match the app's sophisticated design system
 */
import Swal from 'sweetalert2';

// Check if dark mode is enabled
const isDarkMode = () => document.documentElement.classList.contains('dark');

// Get theme-aware colors
const getThemeColors = () => {
  const dark = isDarkMode();
  return {
    background: dark ? '#1e293b' : '#ffffff', // slate-800 / white
    text: dark ? '#f1f5f9' : '#1e293b', // slate-100 / slate-800
    confirmButton: '#0d9488', // teal-600
    cancelButton: dark ? '#475569' : '#94a3b8', // slate-600 / slate-400
    denyButton: '#dc2626', // red-600
    inputBackground: dark ? '#0f172a' : '#f8fafc', // slate-900 / slate-50
    inputBorder: dark ? '#334155' : '#e2e8f0', // slate-700 / slate-200
  };
};

// Custom class configuration for professional styling
const getSwalClasses = () => ({
  popup: 'rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl',
  title: 'text-slate-800 dark:text-slate-100 font-serif font-medium',
  htmlContainer: 'text-slate-600 dark:text-slate-300',
  confirmButton: 'rounded-lg px-6 py-2.5 font-medium transition-colors',
  cancelButton: 'rounded-lg px-6 py-2.5 font-medium transition-colors',
  denyButton: 'rounded-lg px-6 py-2.5 font-medium transition-colors',
  input: 'rounded-lg border focus:ring-2 focus:ring-teal-500/20',
  validationMessage: 'text-red-500 dark:text-red-400',
});

/**
 * Pre-configured Swal with professional theme
 */
export const swal = Swal.mixin({
  customClass: getSwalClasses(),
  buttonsStyling: false, // Use custom styling
  showClass: {
    popup: 'animate-fade-in'
  },
  hideClass: {
    popup: 'animate-fade-out'
  },
  didOpen: () => {
    // Apply dynamic theme colors when popup opens
    const colors = getThemeColors();
    const popup = Swal.getPopup();
    if (popup) {
      popup.style.backgroundColor = colors.background;
      popup.style.color = colors.text;
    }
    const title = Swal.getTitle();
    if (title) {
      title.style.color = colors.text;
    }
    const htmlContainer = Swal.getHtmlContainer();
    if (htmlContainer) {
      htmlContainer.style.color = colors.text;
    }
    // Style confirm button
    const confirmBtn = Swal.getConfirmButton();
    if (confirmBtn) {
      confirmBtn.style.backgroundColor = '#0d9488';
      confirmBtn.style.color = '#ffffff';
      confirmBtn.style.padding = '0.625rem 1.5rem';
      confirmBtn.style.borderRadius = '0.5rem';
      confirmBtn.style.fontWeight = '500';
      confirmBtn.style.border = 'none';
      confirmBtn.style.cursor = 'pointer';
    }
    // Style cancel button
    const cancelBtn = Swal.getCancelButton();
    if (cancelBtn) {
      cancelBtn.style.backgroundColor = '#64748b';
      cancelBtn.style.color = '#ffffff';
      cancelBtn.style.padding = '0.625rem 1.5rem';
      cancelBtn.style.borderRadius = '0.5rem';
      cancelBtn.style.fontWeight = '500';
      cancelBtn.style.border = 'none';
      cancelBtn.style.cursor = 'pointer';
    }
    // Style deny button
    const denyBtn = Swal.getDenyButton();
    if (denyBtn) {
      denyBtn.style.backgroundColor = '#dc2626';
      denyBtn.style.color = '#ffffff';
      denyBtn.style.padding = '0.625rem 1.5rem';
      denyBtn.style.borderRadius = '0.5rem';
      denyBtn.style.fontWeight = '500';
      denyBtn.style.border = 'none';
      denyBtn.style.cursor = 'pointer';
    }
  },
  confirmButtonColor: '#0d9488', // teal-600
  cancelButtonColor: '#64748b', // slate-500
  denyButtonColor: '#dc2626', // red-600
});

/**
 * Confirmation dialog with Save/Don't Save/Cancel options
 */
export const confirmSave = (title = 'บันทึกการเปลี่ยนแปลง?', text = '') => {
  return swal.fire({
    title,
    text,
    icon: 'question',
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: 'บันทึก',
    denyButtonText: 'ไม่บันทึก',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true,
  });
};

/**
 * Simple confirmation dialog (Yes/No)
 */
export const confirm = (title: string, text = '', confirmText = 'ยืนยัน', cancelText = 'ยกเลิก') => {
  return swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
  });
};

/**
 * Delete confirmation dialog
 */
export const confirmDelete = (itemName = 'รายการนี้') => {
  return swal.fire({
    title: 'ยืนยันการลบ?',
    text: `คุณต้องการลบ ${itemName} หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ลบ',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#dc2626', // red-600
    reverseButtons: true,
  });
};

/**
 * Success notification
 */
export const showSuccess = (title = 'สำเร็จ!', text = '') => {
  return swal.fire({
    title,
    text,
    icon: 'success',
    confirmButtonText: 'Close',
    timer: 3000,
    timerProgressBar: true,
  });
};

/**
 * Error notification
 */
export const showError = (title = 'เกิดข้อผิดพลาด', text = '') => {
  return swal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonText: 'Close',
  });
};

/**
 * Info notification
 */
export const showInfo = (title: string, text = '') => {
  return swal.fire({
    title,
    text,
    icon: 'info',
    confirmButtonText: 'Close',
  });
};

/**
 * Warning notification
 */
export const showWarning = (title: string, text = '') => {
  return swal.fire({
    title,
    text,
    icon: 'warning',
    confirmButtonText: 'Close',
  });
};

/**
 * Input dialog
 */
export const promptInput = (title: string, inputPlaceholder = '', inputValue = '') => {
  const colors = getThemeColors();
  return swal.fire({
    title,
    input: 'text',
    inputPlaceholder,
    inputValue,
    showCancelButton: true,
    confirmButtonText: 'ตกลง',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true,
    inputAttributes: {
      style: `background-color: ${colors.inputBackground}; border-color: ${colors.inputBorder}; color: ${colors.text};`
    },
    inputValidator: (value) => {
      if (!value) {
        return 'กรุณากรอกข้อมูล';
      }
      return null;
    },
  });
};

/**
 * Loading indicator
 */
export const showLoading = (title = 'กำลังดำเนินการ...') => {
  swal.fire({
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

/**
 * Close any open Swal
 */
export const closeSwal = () => {
  Swal.close();
};

// Export base Swal for advanced usage
export { Swal };
export default swal;
