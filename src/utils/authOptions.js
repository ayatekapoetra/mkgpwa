import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    CredentialsProvider({
      id: 'login',
      name: 'login',
      credentials: {
        username: { name: 'username', label: 'Username', type: 'text', placeholder: 'Enter username' },
        password: { name: 'password', label: 'Password', type: 'password', placeholder: 'Enter Password' },
        remember: { name: 'remember', label: 'Remember Me', type: 'boolean' }
      },
      async authorize(credentials) {
        try {
          const endpointAuthNew = process.env.NEXT_APP_API_URL + '/api/auth/login';
          const user = await axios.post(endpointAuthNew, {
            password: credentials?.password,
            username: credentials?.username
          });

          // console.log('auth-user', user);

          if (user) {
            user.data.user['accessToken'] = user.data.data.token;
            const employee = {
              employee_id: user.data.employee.id,
              cabang_id: user.data.employee.cabang_id,
              section: user.data.employee.section,
              ktp: user.data.employee.ktp,
              nik: user.data.employee.nik,
              nama: user.data.employee.nama,
              phone: user.data.employee.phone,
              remember: credentials?.remember || false // Add remember flag
            };
            return { ...user.data.user, ...employee };
          }
        } catch (e) {
          if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            console.log('Auth error:', e);
          }
          const errorMessage = e?.response?.data?.message || e?.message || 'Invalid username or password';
          throw new Error(errorMessage);
        }
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user, account }) => {
      // console.log('JWT', user);

      if (user) {
        token.accessToken = user.accessToken;
        token.id = user.id;
        token.name = user.nama_lengkap;
        token.usertype = user.usertype;
        token.handphone = user.handphone;
        token.employee_id = user.employee_id;
        token.cabang_id = user.cabang_id;
        token.section = user.section;
        token.ktp = user.ktp;
        token.nik = user.nik;
        token.nama = user.nama;
        token.phone = user.phone;
        token.provider = account?.provider;
        token.remember = user.remember || false;

        // Set token expiration based on remember me
        if (user.remember) {
          token.exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 days
        } else {
          token.exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24 hours
        }
      }
      return token;
    },
    session: ({ session, token }) => {
      if (token) {
        session.id = token.id;
        session.provider = token.provider;
        session.token = token;
        session.name = token.name;
        session.usertype = token.usertype;
        session.handphone = token.handphone;
        session.alamat = token.alamat;
        session.employee_id = token.employee_id;
        session.cabang_id = token.cabang_id;
        session.section = token.section;
        session.ktp = token.ktp;
        session.nik = token.nik;
        session.nama = token.nama;
        session.phone = token.phone;
        session.remember = token.remember || false;

        // Set session maxAge based on remember me
        session.maxAge = token.remember
          ? Number(process.env.NEXT_APP_JWT_TIMEOUT_REMEMBER) // 7 days
          : Number(process.env.NEXT_APP_JWT_TIMEOUT); // 24 hours
      }
      return session;
    }
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET
  },
  pages: {
    signIn: '/login',
    error: '/auth/error'
  },
  useSession: true,
  events: {
    async signIn() {
      // Handle sign in event
    },
    async signOut() {
      // Handle sign out event
    },
    async session() {
      // Handle session event
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: Number(process.env.NEXT_APP_JWT_TIMEOUT) // Default: 24 hours
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false,
        maxAge: Number(process.env.NEXT_APP_JWT_TIMEOUT) // Default: 24 hours
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false,
        maxAge: 60 * 60 * 24 // 24 hours
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false,
        maxAge: 60 * 60 * 24 // 24 hours
      }
    }
  }
};
