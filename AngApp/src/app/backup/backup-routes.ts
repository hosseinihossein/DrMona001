import { Routes } from "@angular/router";
import { Backup } from "./backup/backup";
import { authGuard } from "../identity/auth-guard";
import { backupAdminGuard } from "./backup-admin-guard";
import { Restore } from "./restore/restore";

export const backupRoutes: Routes = [
    {path: "Backup", component: Backup, canActivate: [backupAdminGuard]},
    {path: "Restore", component: Restore, canActivate: [backupAdminGuard]},
];