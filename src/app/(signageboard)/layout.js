import PropTypes from 'prop-types';

// PROJECT IMPORTS
import SignagesLayout from 'layout/SignagesLayout';

// ================================|| SIMPLE LAYOUT ||================================ //

export default function Layout({ children }) {
  return <SignagesLayout>{children}</SignagesLayout>;
}

Layout.propTypes = {
  children: PropTypes.node
};
