import router from "next/router";
import { createContext, ReactNode, useEffect, useState } from "react";
import { setCookie, parseCookies, destroyCookie } from "nookies";
import { api } from "../services/apiClient";

type SigninCredentials = {
  email: string;
  password: string;
};

type AuthContextData = {
  signIn(credentials: SigninCredentials): Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
  user: User;
};

export const AuthContext = createContext({} as AuthContextData);
let authChannel: BroadcastChannel;

type AuthProviderProps = {
  children: ReactNode;
};

type User = {
  email: string;
  permissions: string[];
  roles: string[];
};

export function signOut() {
  destroyCookie(undefined, "user.token");
  destroyCookie(undefined, "user.refreshToken");

  authChannel.postMessage("signOut");
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>({} as User);
  const isAuthenticated = !!user;

  async function signIn({ email, password }: SigninCredentials) {
    try {
      const response = await api.post("sessions", {
        email: email,
        password: password,
      });

      const { token, refreshToken, permissions, roles } = response.data;

      setCookie(undefined, "user.token", token, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
      setCookie(undefined, "user.refreshToken", refreshToken);

      setUser({
        email,
        permissions,
        roles,
      });

      api.defaults.headers["Authorization"] = `Bearer ${token}`;

      router.push("dashboard");

      authChannel.postMessage("signIn");
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    const { "user.token": token } = parseCookies();

    if (token) {
      api
        .get("/me")
        .then((response) => {
          const { email, permissions, roles } = response.data;

          console.log({
            email,
            permissions,
            roles,
          });

          setUser({
            email,
            permissions,
            roles,
          });
        })
        .catch(() => {
          signOut();
          router.push("/");
        });
    }
  }, []);

  useEffect(() => {
    authChannel = new BroadcastChannel("auth");

    authChannel.onmessage = (message) => {
      switch (message.data) {
        case "signOut":
          signOut();
          router.push("/");
          break;
        default:
          break;
      }
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        isAuthenticated,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
