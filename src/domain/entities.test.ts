import { describe, it, expect } from 'vitest';
import { ProjectSchema, EvidenceSchema, UserProfileSchema } from './entities';

describe('Domain Entities', () => {
    describe('ProjectSchema', () => {
        it('should validate a valid project', () => {
            const validProject = {
                id: 'proj_123',
                name: 'My Thesis',
                description: 'A study on magnets',
                conceptIds: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
                archived: false,
                paperIds: [],
            };
            
            const result = ProjectSchema.safeParse(validProject);
            expect(result.success).toBe(true);
        });

        it('should fail if title is missing', () => {
            const invalidProject = {
                id: 'proj_123',
                // name missing
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            const result = ProjectSchema.safeParse(invalidProject);
            expect(result.success).toBe(false);
        });
    });

    describe('EvidenceSchema', () => {
        it('should default type to quote and confidence to high', () => {
            const minimalEvidence = {
                id: 'ev_123',
                projectId: 'proj_1',
                paperId: 'paper_1',
                text: 'The mitochondria is the powerhouse.',
                provenance: { page: 1 },
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };

            const result = EvidenceSchema.safeParse(minimalEvidence);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.type).toBe('quote');
                expect(result.data.confidence).toBe('high');
            }
        });
    });
});
