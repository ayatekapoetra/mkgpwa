import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'utils/axios';

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
          const endpointAuthNew = process.env.NEXT_APP_API_URL + '/auth/login';
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
            return { ...user.data.user, ...employee, authPortal: 'internal' };
          }
        } catch (e) {
          if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            console.log('Auth error:', e);
          }
          const errorMessage = e?.response?.data?.message || e?.message || 'Invalid username or password';
          throw new Error(errorMessage);
        }
      }
    }),
    CredentialsProvider({
      id: 'login-customers',
      name: 'login-customers',
      credentials: {
        username: { name: 'username', label: 'Username', type: 'text', placeholder: 'Enter username' },
        password: { name: 'password', label: 'Password', type: 'password', placeholder: 'Enter Password' },
        remember: { name: 'remember', label: 'Remember Me', type: 'boolean' }
      },
      async authorize(credentials) {
        try {
          const endpoint = process.env.NEXT_APP_API_URL + '/auth/login-customers';
          const result = await axios.post(endpoint, {
            username: credentials?.username,
            password: credentials?.password
          });

          if (result?.data?.user) {
            const user = result.data.user;
            const pelanggan = result.data.pelanggan || {};
            return {
              ...user,
              username: user.username,
              accessToken: result.data?.data?.token,
              nama: pelanggan.nama || user.nama_lengkap || user.username,
              phone: pelanggan.phone || user.handphone || null,
              pelanggan_id: pelanggan.id || null,
              pelanggan_kode: pelanggan.kode || null,
              pelanggan_nama: pelanggan.nama || null,
              pelanggan_email: pelanggan.email || null,
              pelanggan_phone: pelanggan.phone || null,
              bisnis_id: pelanggan.bisnis_id || null,
              remember: credentials?.remember || false,
              authPortal: 'customers'
            };
          }
        } catch (e) {
          if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            console.log('Customer auth error:', e);
          }
          const errorMessage =
            e?.response?.data?.diagnostic?.message ||
            e?.response?.data?.message ||
            e?.message ||
            'Invalid username or password';
          throw new Error(errorMessage);
        }
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user, account, trigger, session }) => {
      // console.log('JWT', user);

      if (user) {
        token.accessToken = user.accessToken;
        token.id = user.id;
        token.name = user.nama_lengkap || user.nama || user.username;
        token.username = user.username || null;
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
        token.authPortal = user.authPortal || (account?.provider === 'login-customers' ? 'customers' : 'internal');
        token.pelanggan_id = user.pelanggan_id || null;
        token.pelanggan_kode = user.pelanggan_kode || null;
        token.pelanggan_nama = user.pelanggan_nama || null;
        token.pelanggan_email = user.pelanggan_email || null;
        token.pelanggan_phone = user.pelanggan_phone || null;
        token.bisnis_id = user.bisnis_id || null;

        // Set token expiration based on remember me
        if (user.remember) {
          token.exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 days
        } else {
          token.exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24 hours
        }
      }

      // Support client-side session.update(...) for profile edits
      if (trigger === 'update' && session) {
        if (session.name !== undefined) token.name = session.name;
        if (session.nama !== undefined) token.nama = session.nama;
        if (session.phone !== undefined) token.phone = session.phone;
        if (session.username !== undefined) token.username = session.username;
        if (session.pelanggan_nama !== undefined) token.pelanggan_nama = session.pelanggan_nama;
        if (session.pelanggan_kode !== undefined) token.pelanggan_kode = session.pelanggan_kode;
        if (session.pelanggan_email !== undefined) token.pelanggan_email = session.pelanggan_email;
        if (session.pelanggan_phone !== undefined) token.pelanggan_phone = session.pelanggan_phone;
        if (session.token && typeof session.token === 'object') {
          Object.assign(token, session.token);
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
        session.authPortal = token.authPortal || 'internal';
        session.username = token.username || null;
        session.pelanggan_id = token.pelanggan_id || null;
        session.pelanggan_kode = token.pelanggan_kode || null;
        session.pelanggan_nama = token.pelanggan_nama || null;
        session.pelanggan_email = token.pelanggan_email || null;
        session.pelanggan_phone = token.pelanggan_phone || null;
        session.bisnis_id = token.bisnis_id || null;

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
      name: process.env.NEXTAUTH_SESSION_NAME || 'mrtapp.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false,
        maxAge: Number(process.env.NEXT_APP_JWT_TIMEOUT) // Default: 24 hours
      }
    },
    callbackUrl: {
      name: process.env.NEXTAUTH_CALLBACK_NAME || 'mrtapp.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false,
        maxAge: 60 * 60 * 24 // 24 hours
      }
    },
    csrfToken: {
      name: process.env.NEXTAUTH_CSRF_NAME || 'mrtapp.csrf-token',
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
