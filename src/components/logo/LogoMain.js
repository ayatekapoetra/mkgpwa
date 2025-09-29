import PropTypes from 'prop-types';

const LogoMain = () => {
  return <img src={'/assets/images/mkg.svg'} alt="icon logo" width="200" />;
};

LogoMain.propTypes = {
  reverse: PropTypes.any
};

export default LogoMain;
