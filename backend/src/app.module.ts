import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ExposModule } from './modules/expos/expos.module.js';
import { TasksModule } from './modules/tasks/tasks.module.js';
import { TeamModule } from './modules/team/team.module.js';
import { DiscussionsModule } from './modules/discussions/discussions.module.js';
import { ExhibitorsModule } from './modules/exhibitors/exhibitors.module.js';
import { AgendaModule } from './modules/agenda/agenda.module.js';
import { RegistrationsModule } from './modules/registrations/registrations.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { ActivityModule } from './modules/activity/activity.module.js';


@Module({
  imports: [
    UsersModule,
    AuthModule,
    ExposModule,
    TasksModule,
    TeamModule,
    DiscussionsModule,
    ExhibitorsModule,
    AgendaModule,
    RegistrationsModule,
    DashboardModule,
    ActivityModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
