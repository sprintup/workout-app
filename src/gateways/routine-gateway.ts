import type { CooldownExercise, RoutineExercise } from "../types";
import type { AppStateGateway, RoutineGateway } from "./gateways";

/** The warm-up and auxiliary set (stored as "cooldown") checklists. */
export class DocumentRoutineGateway implements RoutineGateway {
  constructor(private readonly appState: AppStateGateway) {}

  warmups(): RoutineExercise[] {
    return this.appState.current()?.warmupExercises;
  }

  cooldowns(): CooldownExercise[] {
    return this.appState.current()?.cooldownExercises;
  }
}
