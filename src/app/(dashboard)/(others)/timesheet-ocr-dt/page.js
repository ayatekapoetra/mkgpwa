// PROJECT IMPORTS
// import ScanDTTimesheetScreen from 'views/other/upload-ocr/dumptruck';
import MaintenancePage from 'components/maintenance/MaintenancePage';

// ==============================|| DT OCR PAGE - TEMPORARILY DISABLED ||============================== //

const DTOCRPage = () => {
  // Temporarily disabled - return maintenance page
  return (
    <MaintenancePage
      title="DT OCR Timesheet"
      subtitle="Fitur Sementara Tidak Aktif"
      message="Fitur DT OCR Timesheet sedang dalam maintenance. Silakan gunakan cara input manual untuk sementara waktu."
    />
  );

  // Original component (commented out for now)
  // return <ScanDTTimesheetScreen />;
};

export default DTOCRPage;
