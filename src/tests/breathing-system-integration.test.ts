import { loadTechniqueById, isTechniqueV2 } from '@/utils/techniques';

describe('Breathing System Integration Tests', () => {
  describe('Test Technique Validation', () => {
    it('should load and validate the test breathing technique', () => {
      const testTechnique = loadTechniqueById('test_all_features');
      
      expect(testTechnique).not.toBeNull();
      expect(isTechniqueV2(testTechnique)).toBe(true);
      
      if (testTechnique) {
        expect(testTechnique.id).toBe('test_all_features');
        expect(testTechnique.name).toBe('🧪 Test All Features');
        expect(testTechnique.difficulty).toBe('beginner');
        expect(testTechnique.estimated_duration_minutes).toBe(1);
      }
    });

    it('should have correct breathing pattern for quick testing', () => {
      const testTechnique = loadTechniqueById('test_all_features');
      
      expect(testTechnique).not.toBeNull();
      
      if (testTechnique) {
        const firstRound = testTechnique.rounds[0];
        expect(firstRound.phases.inhale).toBe(2);
        expect(firstRound.phases.hold_in).toBe(2);
        expect(firstRound.phases.exhale).toBe(2);
        expect(firstRound.phases.hold_out).toBe(1);
        expect(firstRound.repetitions).toBe(8);
      }
    });

    it('should have both repetition and time-based triggers', () => {
      const testTechnique = loadTechniqueById('test_all_features');
      
      expect(testTechnique).not.toBeNull();
      
      if (testTechnique) {
        const roundMessages = testTechnique.rounds[0].round_messages;
        expect(roundMessages).toBeDefined();
        
        if (roundMessages) {
          // Check for repetition triggers
          const repetitionTriggers = roundMessages.filter(
            msg => msg.trigger?.type === 'repetition'
          );
          expect(repetitionTriggers.length).toBeGreaterThan(0);
          
          // Check for time triggers
          const timeTriggers = roundMessages.filter(
            msg => msg.trigger?.type === 'time'
          );
          expect(timeTriggers.length).toBeGreaterThan(0);
          
          // Check for all message types
          const infoMessages = roundMessages.filter(msg => msg.type === 'info');
          const warningMessages = roundMessages.filter(msg => msg.type === 'warning');
          const successMessages = roundMessages.filter(msg => msg.type === 'success');
          
          expect(infoMessages.length).toBeGreaterThan(0);
          expect(warningMessages.length).toBeGreaterThan(0);
          expect(successMessages.length).toBeGreaterThan(0);
        }
      }
    });

    it('should have proper pre-session messages', () => {
      const testTechnique = loadTechniqueById('test_all_features');
      
      expect(testTechnique).not.toBeNull();
      
      if (testTechnique) {
        const preSession = testTechnique.technique_messages?.pre_session;
        expect(preSession).toBeDefined();
        expect(preSession?.length).toBeGreaterThan(0);
        
        // Check for different message types in pre-session
        if (preSession) {
          const hasInfo = preSession.some(msg => msg.type === 'info');
          const hasWarning = preSession.some(msg => msg.type === 'warning');
          const hasSuccess = preSession.some(msg => msg.type === 'success');
          
          expect(hasInfo).toBe(true);
          expect(hasWarning).toBe(true);
          expect(hasSuccess).toBe(true);
        }
      }
    });

    it('should have reasonable trigger timing for testing', () => {
      const testTechnique = loadTechniqueById('test_all_features');
      
      expect(testTechnique).not.toBeNull();
      
      if (testTechnique) {
        const roundMessages = testTechnique.rounds[0].round_messages;
        
        if (roundMessages) {
          const timeTriggers = roundMessages
            .filter(msg => msg.trigger?.type === 'time')
            .map(msg => msg.trigger?.value)
            .filter(Boolean) as number[];
          
          // Time triggers should be within reasonable testing range (< 60 seconds)
          timeTriggers.forEach(time => {
            expect(time).toBeLessThan(60);
            expect(time).toBeGreaterThan(0);
          });
          
          const repetitionTriggers = roundMessages
            .filter(msg => msg.trigger?.type === 'repetition')
            .map(msg => msg.trigger?.value)
            .filter(Boolean) as number[];
          
          // Repetition triggers should be within the 8 repetitions
          repetitionTriggers.forEach(rep => {
            expect(rep).toBeLessThanOrEqual(8);
            expect(rep).toBeGreaterThan(0);
          });
        }
      }
    });
  });

  describe('Breathing Technique Schema Validation', () => {
    it('should validate all existing breathing techniques', () => {
      const techniques = [
        'box_breathing',
        'breathing_478',
        'triangle_breathing',
        'coherent_breathing',
        'extended_exhale',
        'wim_hof',
        'breath_of_fire',
        'test_all_features'
      ];

      techniques.forEach(techniqueId => {
        const technique = loadTechniqueById(techniqueId);
        expect(technique).not.toBeNull();
        expect(isTechniqueV2(technique)).toBe(true);
        
        if (technique) {
          // Basic structure validation
          expect(technique.id).toBe(techniqueId);
          expect(technique.name).toBeTruthy();
          expect(technique.description).toBeTruthy();
          expect(technique.explanation).toBeTruthy();
          expect(technique.when_to_use).toBeTruthy();
          expect(technique.rounds.length).toBeGreaterThan(0); // Techniques can have multiple rounds
          expect(technique.recommended_cycles).toBeGreaterThan(0);
          expect(['beginner', 'intermediate', 'advanced']).toContain(technique.difficulty);
          
          // Validate phases
          const phases = technique.rounds[0].phases;
          expect(phases.inhale).toBeGreaterThanOrEqual(0);
          expect(phases.hold_in).toBeGreaterThanOrEqual(0);
          expect(phases.exhale).toBeGreaterThanOrEqual(0);
          expect(phases.hold_out).toBeGreaterThanOrEqual(0);
          
          // At least one phase should be > 0
          const totalDuration = phases.inhale + phases.hold_in + phases.exhale + phases.hold_out;
          expect(totalDuration).toBeGreaterThan(0);
        }
      });
    });

    it('should validate round messages format when present', () => {
      const techniqueWithMessages = loadTechniqueById('test_all_features');
      
      if (techniqueWithMessages?.rounds[0].round_messages) {
        const messages = techniqueWithMessages.rounds[0].round_messages;
        
        messages.forEach(message => {
          expect(['info', 'warning', 'success']).toContain(message.type);
          expect(message.text).toBeTruthy();
          
          if (message.trigger) {
            expect(['repetition', 'time']).toContain(message.trigger.type);
            expect(message.trigger.value).toBeGreaterThan(0);
            
            if (message.trigger.type === 'repetition') {
              expect(Number.isInteger(message.trigger.value)).toBe(true);
            }
          }
        });
      }
    });
  });

  describe('System Performance Characteristics', () => {
    it('should have reasonable total cycle duration for test technique', () => {
      const testTechnique = loadTechniqueById('test_all_features');
      
      if (testTechnique) {
        const phases = testTechnique.rounds[0].phases;
        const singleCycleDuration = phases.inhale + phases.hold_in + phases.exhale + phases.hold_out;
        const totalDuration = singleCycleDuration * testTechnique.rounds[0].repetitions;
        
        // Should complete in reasonable time for testing (under 1 minute)
        expect(totalDuration).toBeLessThan(60);
        expect(singleCycleDuration).toBe(7); // 2+2+2+1 = 7 seconds
        expect(totalDuration).toBe(56); // 7 * 8 = 56 seconds
      }
    });

    it('should provide comprehensive testing coverage', () => {
      const testTechnique = loadTechniqueById('test_all_features');
      
      expect(testTechnique).not.toBeNull();
      
      if (testTechnique) {
        // Should have technique messages
        expect(testTechnique.technique_messages?.pre_session).toBeDefined();
        
        // Should have round messages
        expect(testTechnique.rounds[0].round_messages).toBeDefined();
        
        // Should have cautions
        expect(testTechnique.cautions).toBeDefined();
        expect(testTechnique.cautions?.length).toBeGreaterThan(0);
        
        const messages = testTechnique.rounds[0].round_messages || [];
        
        // Should test both trigger types
        const hasBothTriggerTypes = 
          messages.some(m => m.trigger?.type === 'repetition') &&
          messages.some(m => m.trigger?.type === 'time');
        expect(hasBothTriggerTypes).toBe(true);
        
        // Should test all message types
        const hasAllMessageTypes = 
          messages.some(m => m.type === 'info') &&
          messages.some(m => m.type === 'warning') &&
          messages.some(m => m.type === 'success');
        expect(hasAllMessageTypes).toBe(true);
      }
    });
  });
});