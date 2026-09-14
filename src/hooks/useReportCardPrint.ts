import { triggerUniversalPrint } from '../utils/printHelper';

export function useReportCardPrint() {
  const handlePrint = (studentName?: string) => {
    const printJobTitle = studentName
      ? `වාර_ප්‍රගති_වාර්තාව_${studentName.replace(/\s+/g, '_')}`
      : 'ශ්‍රී සුමන මහා පිරිවෙන - ප්‍රගති වාර්තාව';

    // Trigger universal print (Android Native PrintManager + Web print)
    triggerUniversalPrint(printJobTitle);
  };

  return { handlePrint };
}
