import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { destroyCookie, parseCookies } from "nookies";
import { AuthTokenError } from "../services/errors/AuthTokenError";
import decode from 'jwt-decode';
import { validateuserPermissions } from "./validateUserPermissions";

type WithSSRAuthOptions = { permissions?: string[], roles?: string[] }

export function withSSRAuth<P extends { [key: string]: any; }>(fn: GetServerSideProps<P>,
    options?: WithSSRAuthOptions) {
    return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {
        const cookies = parseCookies(ctx);
        const token = cookies["user.token"];

        if (!token) {
            return {
                redirect: {
                    destination: "/",
                    permanent: false,
                },
            };
        }

        if (options) {
            const user = decode<{ permissions: string[], roles: string[] }>(token);
            const { permissions, roles } = options;

            const userHasValidPermissions = validateuserPermissions({
                user,
                permissions,
                roles
            })

            if (!userHasValidPermissions) {
                return {
                    redirect: {
                        destination: "/dashboard",
                        permanent: false,
                    }
                }
            }
        }

        try {
            return await fn(ctx)
        } catch (error) {
            if (error instanceof AuthTokenError) {
                destroyCookie(ctx, 'user.token');
                destroyCookie(ctx, 'user.refreshToken')

                return {
                    redirect: {
                        destination: "/",
                        permanent: false,
                    }
                }
            }

            return Promise.reject(error);
        }

    }
}