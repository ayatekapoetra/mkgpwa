// PROJECT IMPORTS
// import ScanABTimesheetScreen from 'views/other/upload-ocr/alat-berat';
import MaintenancePage from 'components/maintenance/MaintenancePage';

// ==============================|| AB OCR PAGE - TEMPORARILY DISABLED ||============================== //

const ABOCRPage = () => {
  // Temporarily disabled - return maintenance page
  return (
    <MaintenancePage
      title="AB OCR Timesheet"
      subtitle="Fitur Sementara Tidak Aktif"
      message="Fitur AB OCR Timesheet sedang dalam maintenance. Silakan gunakan cara input manual untuk sementara waktu."
    />
  );

  // Original component (commented out for now)
  // return <ScanABTimesheetScreen />;
};

export default ABOCRPage;
