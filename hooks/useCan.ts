import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { validateuserPermissions } from "../utils/validateUserPermissions";

type UserCanParams = {
    permissions?: string[];
    roles?: string[];
}

export function useCan({ permissions, roles }: UserCanParams) {
    const { user, isAuthenticated } = useContext(AuthContext)

    if (!isAuthenticated) {
        return false;
    }

    const userHasValidPermissions = validateuserPermissions({
        user,
        permissions,
        roles,
    })

    return userHasValidPermissions;
}