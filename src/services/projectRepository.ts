import { BaseRepository } from './repository';
import { Project, ProjectSchema } from '../domain/project';
import { where } from 'firebase/firestore';

export class ProjectRepository extends BaseRepository<Project> {
  constructor() {
    super('projects', ProjectSchema);
  }

  async getProjectsForUser(userId: string): Promise<Project[]> {
    return this.getAll([where('ownerId', '==', userId), where('archived', '==', false)]);
  }

  async getArchivedProjectsForUser(userId: string): Promise<Project[]> {
      return this.getAll([where('ownerId', '==', userId), where('archived', '==', true)]);
  }
}

export const projectRepository = new ProjectRepository();
