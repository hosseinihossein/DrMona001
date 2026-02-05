import { Routes } from "@angular/router";
import { authGuard } from "../identity/auth-guard";
import { DocumentPage } from "./document-page/document-page";

export const documentRoutes: Routes = [
    //{path: "document/:patientGuid", component: DocumentPage, canActivate: [authGuard]},
];