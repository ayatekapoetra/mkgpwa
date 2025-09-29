'use client';

// PROJECT IMPORTS

// PROJECT IMPORTS
import MiningAuthWrapper from 'sections/auth/MiningAuthWrapper';
import MiningLogin from './MiningLogin';

// ================================|| LOGIN ||================================ //

const Login = () => {
  return (
    <MiningAuthWrapper>
      <MiningLogin />
    </MiningAuthWrapper>
  );
};

export default Login;
