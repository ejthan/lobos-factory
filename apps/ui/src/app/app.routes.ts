import { Route } from '@angular/router';
import { ReposPage } from './repos.page';
import { BoardPage } from './board.page';
import { TicketPage } from './ticket.page';
import { DashboardPage } from './dashboard.page';

export const appRoutes: Route[] = [
  { path: '', component: ReposPage },
  { path: 'repo/:repoId', component: BoardPage },
  { path: 'repo/:repoId/dashboard', component: DashboardPage },
  { path: 'repo/:repoId/ticket/:ticketId', component: TicketPage },
];
