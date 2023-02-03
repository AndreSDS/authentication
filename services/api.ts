import axios, { AxiosError } from 'axios';
import { GetServerSidePropsContext } from 'next';
import { parseCookies, setCookie } from 'nookies';
import { signOut } from '../contexts/AuthContext';
import { AuthTokenError } from './errors/AuthTokenError';
import router from 'next/router';

let isRefreshing = false;
let failedRequestsQeue: any[] = [];

export function setupApiClient(ctx: GetServerSidePropsContext | undefined) {
    let cookies = parseCookies(ctx);

    const api = axios.create({
        baseURL: "http://localhost:3333",
        headers: {
            Authorization: `Bearer ${cookies['user.token']}`
        }
    })

    api.interceptors.response.use(response => { return response }, (error: AxiosError) => {
        if (error.response?.status === 401) {
            const errorData: any = error.response.data

            if (errorData.code === 'token.expired') {
                cookies = parseCookies(undefined);

                const { 'user.refreshToken': refreshToken } = cookies;
                const originalConfig: any = error.config || {};

                if (!isRefreshing) {
                    isRefreshing = true;

                    api.post('/refresh', {
                        refreshToken
                    }).then(response => {
                        setCookie(ctx, "user.token", response.data.token, {
                            maxAge: 60 * 60 * 24 * 30, // 30 days
                            path: "/",
                        });

                        setCookie(ctx, "user.refreshToken", response.data.refreshToken, {
                            maxAge: 60 * 60 * 24 * 30, // 30 days
                            path: "/",
                        });

                        api.defaults.headers["Authorization"] = `Bearer ${response.data.token}`;

                        failedRequestsQeue.forEach(request => request.onSuccess(response.data.token));
                        failedRequestsQeue = [];
                    }).catch((err) => {
                        failedRequestsQeue.forEach(request => request.onFailure(err));
                        failedRequestsQeue = [];

                        if (typeof window === "undefined") {
                            signOut();
                        }
                    }).finally(() => {
                        isRefreshing = false;
                        router.push("/");
                    })
                }

                return new Promise((resolve, reject) => {
                    failedRequestsQeue.push({
                        onSuccess: (token: string) => {
                            originalConfig.headers['Authorization'] = `Bearer ${token}`
                            resolve(api(originalConfig));
                        },
                        onFailure: (err: AxiosError) => {
                            reject(err);
                        }
                    })
                })
            } else {
                if (typeof window === "undefined") {
                    signOut();
                } else {
                    return Promise.reject(new AuthTokenError());
                }
            }
        }

        return Promise.reject(error);
    })

    return api;
}