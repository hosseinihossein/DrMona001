import { Routes } from '@angular/router';
import { Home } from './home/home';
import { identityRoutes } from './identity/identity-routes';

export const routes: Routes = [
    {path: "", component: Home},
    {path: "AccessDenied", component: Home, data:{accessDenied:true}},
    ...identityRoutes,
];
