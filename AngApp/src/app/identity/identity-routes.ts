import { Routes } from '@angular/router';
import { Login } from './login/login';
import { authGuard } from './auth-guard';
import { UserProfile } from './user-profile/user-profile';

export const identityRoutes: Routes = [
    {path: "login", component: Login},
    {path: "user-profile", component:UserProfile, canActivate: [authGuard]},
];
