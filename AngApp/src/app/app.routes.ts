import { Routes } from '@angular/router';
import { Home } from './home/home';
import { identityRoutes } from './identity/identity-routes';
import { authGuard } from './identity/auth-guard';
import { documentRoutes } from './document/document-routes';
import { patientRoutes } from './patient/patient-routes';
import { backupRoutes } from './backup/backup-routes';

export const routes: Routes = [
    {path: "", component: Home, canActivate:[authGuard]},
    {path: "AccessDenied", component: Home, data:{accessDenied:true}},
    ...identityRoutes,
    ...patientRoutes,
    ...documentRoutes,
    ...backupRoutes,
];
