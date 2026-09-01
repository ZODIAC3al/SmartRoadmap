export type ModuleCategory = 'beginner' | 'intermediate' | 'advanced';
export type ProgressionState = 'COMPLETED' | 'AVAILABLE' | 'LOCKED';

export interface ModuleItem {
  id: string;
  title: string;
  description?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | string;
  estimatedHours?: number;
  topics?: string[];
  prerequisites?: string[];
  status?: 'locked' | 'in_progress' | 'completed' | 'failed' | string;
}

export interface NodeProgressionInfo {
  status: ProgressionState;
  isUnlocked: boolean;
  isFirstAvailable: boolean;
  lockReason?: string;
  category: ModuleCategory;
}

export interface RoadmapProgressionResult {
  partition: Record<ModuleCategory, ModuleItem[]>;
  moduleStates: Record<ModuleCategory, ProgressionState>;
  nodeStates: Map<string, NodeProgressionInfo>;
  isNodeUnlocked: (nodeId: string) => boolean;
  getNodeInfo: (nodeId: string) => NodeProgressionInfo | undefined;
  activeOpenNodeId?: string;
}

/**
 * Calculates game-like progressive unlock state for a roadmap.
 *
 * Progression Rules:
 * 1. Beginner module is initially AVAILABLE.
 * 2. Intermediate module unlocks ONLY when all Beginner nodes are completed.
 * 3. Advanced module unlocks ONLY when all Intermediate nodes are completed.
 * 4. Within an unlocked module, ONLY the first incomplete node is AVAILABLE (OPEN).
 * 5. All subsequent incomplete nodes remain LOCKED until previous prerequisites pass.
 */
export function calculateRoadmapProgression(modules: ModuleItem[]): RoadmapProgressionResult {
  const beginner: ModuleItem[] = [];
  const intermediate: ModuleItem[] = [];
  const advanced: ModuleItem[] = [];

  // Partition modules by difficulty or sequential order
  modules.forEach((m, idx) => {
    const d = m.difficulty?.toLowerCase();
    if (d === 'beginner') {
      beginner.push(m);
    } else if (d === 'intermediate') {
      intermediate.push(m);
    } else if (d === 'advanced') {
      advanced.push(m);
    } else {
      if (idx < modules.length / 3) beginner.push(m);
      else if (idx < (2 * modules.length) / 3) intermediate.push(m);
      else advanced.push(m);
    }
  });

  // Fallback if none mapped by difficulty string
  if (beginner.length === 0 && intermediate.length === 0 && advanced.length === 0) {
    modules.forEach((m, idx) => {
      if (idx < modules.length / 3) beginner.push(m);
      else if (idx < (2 * modules.length) / 3) intermediate.push(m);
      else advanced.push(m);
    });
  }

  const isCategoryComplete = (list: ModuleItem[]) =>
    list.length > 0 && list.every((m) => m.status === 'completed');

  const beginnerCompleted = isCategoryComplete(beginner);
  const intermediateCompleted = isCategoryComplete(intermediate);
  const advancedCompleted = isCategoryComplete(advanced);

  const moduleStates: Record<ModuleCategory, ProgressionState> = {
    beginner: beginnerCompleted ? 'COMPLETED' : 'AVAILABLE',
    intermediate: !beginnerCompleted
      ? 'LOCKED'
      : intermediateCompleted
      ? 'COMPLETED'
      : 'AVAILABLE',
    advanced: !(beginnerCompleted && intermediateCompleted)
      ? 'LOCKED'
      : advancedCompleted
      ? 'COMPLETED'
      : 'AVAILABLE',
  };

  const nodeStates = new Map<string, NodeProgressionInfo>();
  let activeOpenNodeId: string | undefined = undefined;

  const processCategory = (
    categoryList: ModuleItem[],
    catKey: ModuleCategory,
    isUnlockedCategory: boolean,
    prevCategoryName?: string
  ) => {
    let foundFirstIncompleteInModule = false;

    categoryList.forEach((node) => {
      if (!isUnlockedCategory) {
        nodeStates.set(node.id, {
          status: 'LOCKED',
          isUnlocked: false,
          isFirstAvailable: false,
          lockReason: `Complete all ${prevCategoryName} modules first to unlock.`,
          category: catKey,
        });
      } else if (node.status === 'completed') {
        nodeStates.set(node.id, {
          status: 'COMPLETED',
          isUnlocked: true,
          isFirstAvailable: false,
          category: catKey,
        });
      } else if (!foundFirstIncompleteInModule) {
        foundFirstIncompleteInModule = true;
        if (!activeOpenNodeId) {
          activeOpenNodeId = node.id;
        }
        nodeStates.set(node.id, {
          status: 'AVAILABLE',
          isUnlocked: true,
          isFirstAvailable: true,
          category: catKey,
        });
      } else {
        nodeStates.set(node.id, {
          status: 'LOCKED',
          isUnlocked: false,
          isFirstAvailable: false,
          lockReason: 'Complete the previous node exam first to unlock.',
          category: catKey,
        });
      }
    });
  };

  processCategory(beginner, 'beginner', true);
  processCategory(intermediate, 'intermediate', beginnerCompleted, 'Beginner');
  processCategory(
    advanced,
    'advanced',
    beginnerCompleted && intermediateCompleted,
    'Intermediate'
  );

  return {
    partition: { beginner, intermediate, advanced },
    moduleStates,
    nodeStates,
    isNodeUnlocked: (nodeId: string) => nodeStates.get(nodeId)?.isUnlocked ?? false,
    getNodeInfo: (nodeId: string) => nodeStates.get(nodeId),
    activeOpenNodeId,
  };
}
