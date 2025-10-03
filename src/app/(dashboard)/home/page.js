// MATERIAL - UI
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';

// PROJECT IMPORTS

import TimesheetReport from 'sections/widget/chart/TimesheetReport';
import TimesheetReportCompact from 'sections/widget/chart/TimesheetReportCompact';
import Visitors from 'sections/widget/chart/Visitors';

import ProjectAnalytics from 'sections/widget/chart/ProjectAnalytics';

import EcommerceIncome from 'sections/widget/chart/EcommerceIncome';
import LanguagesSupport from 'sections/widget/chart/LanguagesSupport';

import ProductOverview from 'sections/widget/chart/ProductOverview';

import PaymentHistory from 'sections/widget/data/PaymentHistory';
import EcommerceRadial from 'sections/widget/chart/EcommerceRadial';

// ==============================|| DASHBOARD - ANALYTICS ||============================== //

const DashboardAnalytics = () => {
  return (
    <Grid container rowSpacing={4.5} columnSpacing={3}>
      {/* row 1 */}
      <Grid item xs={12} lg={8}>
        <TimesheetReport />
      </Grid>
      <Grid item xs={12} lg={4}>
        <Stack spacing={3}>
          <EcommerceRadial />
          <PaymentHistory />
        </Stack>
      </Grid>

      {/* row 2 */}
      <Grid item xs={12} md={6}>
        <ProjectAnalytics />
      </Grid>
      <Grid item xs={12} md={6}>
        <ProductOverview />
      </Grid>

      {/* row 3 */}
      <Grid item xs={12} md={6}>
        <EcommerceIncome />
      </Grid>
      <Grid item xs={12} md={6}>
        <LanguagesSupport />
      </Grid>

      {/* row 4 */}
      <Grid item xs={12} md={8}>
        <Visitors />
      </Grid>
      <Grid item xs={12} md={4}>
        <TimesheetReportCompact />
      </Grid>
    </Grid>
  );
};

export default DashboardAnalytics;
