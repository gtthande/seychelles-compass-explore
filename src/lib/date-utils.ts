/**
 * Lightweight date formatting utilities to replace date-fns
 * Reduces bundle size by ~50KB
 */

export const formatDate = (date: Date | string, format: string): string => {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }

  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const monthNamesShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const dayNames = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Format patterns
  switch (format) {
    case 'PPP': // Pretty date format: "April 29th, 2021"
      return `${monthNames[month]} ${getOrdinal(day)}, ${year}`;
    
    case 'PPp': // Pretty date with time: "April 29th, 2021 at 2:00 PM"
      return `${monthNames[month]} ${getOrdinal(day)}, ${year} at ${formatTime(hours, minutes)}`;
    
    case 'MMM dd, yyyy': // "Apr 29, 2021"
      return `${monthNamesShort[month]} ${day.toString().padStart(2, '0')}, ${year}`;
    
    case 'HH:mm': // "14:00"
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    case 'MMM dd': // "Apr 29"
      return `${monthNamesShort[month]} ${day.toString().padStart(2, '0')}`;
    
    case 'yyyy-MM-dd': // "2021-04-29"
      return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    case 'dd/MM/yyyy': // "29/04/2021"
      return `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}`;
    
    case 'MM/dd/yyyy': // "04/29/2021"
      return `${(month + 1).toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
    
    case 'EEEE, MMMM do, yyyy': // "Thursday, April 29th, 2021"
      return `${dayNames[d.getDay()]}, ${monthNames[month]} ${getOrdinal(day)}, ${year}`;
    
    default:
      // Fallback to basic format
      return d.toLocaleDateString();
  }
};

const getOrdinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const formatTime = (hours: number, minutes: number): string => {
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${period}`;
};

// Additional utility functions
export const isToday = (date: Date | string): boolean => {
  const d = new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

export const isYesterday = (date: Date | string): boolean => {
  const d = new Date(date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.toDateString() === yesterday.toDateString();
};

export const addDays = (date: Date | string, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export const addMonths = (date: Date | string, months: number): Date => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

export const startOfDay = (date: Date | string): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfDay = (date: Date | string): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};
