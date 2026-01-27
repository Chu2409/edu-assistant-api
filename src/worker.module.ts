import { CoreModule } from "./core/core.module";
import { PagesModule } from "./features/pages/main/pages.module";
import { Module } from "@nestjs/common";
import { ConceptsWorker } from "./features/pages/concepts/concepts.worker";

@Module({
  imports: [
    CoreModule,
    PagesModule,
  ],
  providers: [ConceptsWorker],
})
export class WorkerModule { }
