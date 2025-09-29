// NEXT
import { useSession } from 'next-auth/react';

const useUser = () => {
  const { data: session } = useSession();
  // console.log('session....', session);

  if (session) {
    const user = session?.user;

    user.employee_id = session?.employee_id;
    user.fullname = session?.nama;
    user.handphone = session?.phone;
    user.email = session?.token.email;
    user.ktp = session?.ktp;
    user.nik = session?.nik;
    user.cabang_id = session?.cabang_id;
    user.section = session?.section;
    user.role = session?.usertype;
    const provider = session?.provider;
    let thumb = user?.image;

    if (provider === 'cognito') {
      const email = user?.email?.split('@');
      user.name = email ? email[0] : 'Jone Doe';
    }

    if (!user?.image) {
      user.image = '/assets/images/users/avatar-1.png';
      thumb = '/assets/images/users/avatar-thumb-1.png';
    }

    const newUser = {
      employee_id: user.employee_id,
      name: user.fullname,
      email: user.email,
      handphone: user.handphone,
      ktp: user.ktp,
      nik: user.nik,
      cabang_id: user?.cabang_id,
      section: user.section,
      avatar: user?.image,
      role: user?.role,
      thumb
    };

    return newUser;
  }
  return false;
};

export default useUser;
