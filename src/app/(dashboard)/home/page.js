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
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={12}>
            <Visitors />
          </Grid>
          <Grid item xs={12} md={6} lg={12}>
            <TimesheetReportCompact />
          </Grid>
        </Grid>
      </Grid>

      {/* row 2 */}
      <Grid item xs={12}>
        <ProjectAnalytics />
      </Grid>

      {/* row 3 */}
      <Grid item xs={12} lg={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={12}>
            <EcommerceIncome />
          </Grid>
          <Grid item xs={12} md={6} lg={12}>
            <LanguagesSupport />
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12} md={6}>
        <ProductOverview />
      </Grid>
      <Grid item xs={12} lg={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={12}>
            <PaymentHistory />
          </Grid>
          <Grid item xs={12} md={6} lg={12}>
            <Stack spacing={3}>
              <EcommerceRadial color="primary.main" />
              <EcommerceRadial color="error.dark" />
            </Stack>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default DashboardAnalytics;
