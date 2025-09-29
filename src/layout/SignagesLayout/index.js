'use client';

import PropTypes from 'prop-types';

// PROJECT IMPORTS
import Loader from 'components/Loader';
import { useGetMenuMaster } from 'api/menu';

// ==============================|| LAYOUTS - STRUCTURE ||============================== //

const SignagesLayout = ({ children }) => {
  const { menuMasterLoading } = useGetMenuMaster();

  if (menuMasterLoading) return <Loader />;

  return <>{children}</>;
};

SignagesLayout.propTypes = {
  children: PropTypes.node
};
export default SignagesLayout;
