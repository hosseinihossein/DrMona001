import { Routes } from '@angular/router';
import { Login } from './login/login';
import { authGuard } from './auth-guard';
import { UserProfile } from './user-profile/user-profile';
import { AccountSettings } from './account-settings/account-settings';
import { NewUserForm } from './admin/new-user-form/new-user-form';
import { identityAdminGuard } from './admin/identity-admin-guard';
import { EditUserForm } from './admin/edit-user-form/edit-user-form';
import { UserList } from './admin/user-list/user-list';

export const identityRoutes: Routes = [
    {path: "login", component: Login},
    {path: "user-profile/:userGuid", component:UserProfile},
    {path: "user-profile", component:UserProfile, canActivate: [authGuard]},
    {path: "user-account-settings", component:AccountSettings, canActivate: [authGuard]},
    {path: "new-user", component:NewUserForm, canActivate: [identityAdminGuard]},
    {path: "edit-user/:userGuid", component:EditUserForm, canActivate: [identityAdminGuard]},
    {path: "user-list", component:UserList, canActivate: [authGuard]},
];
