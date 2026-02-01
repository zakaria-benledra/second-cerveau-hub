import { describe, it, expect, beforeEach } from 'vitest';
import { PolicyEngine, computeReward, ACTIONS } from '@/ai/policy-engine';

describe('PolicyEngine', () => {
  let engine: PolicyEngine;

  beforeEach(() => {
    engine = new PolicyEngine({ epsilon: 0, learningRate: 0.1 });
  });

  describe('chooseAction', () => {
    it('should return a valid action', () => {
      const context = Array(18).fill(0.5);
      const decision = engine.chooseAction(context);
      
      expect(ACTIONS).toContain(decision.action);
      expect(decision.confidence).toBeGreaterThanOrEqual(0);
      expect(decision.confidence).toBeLessThanOrEqual(1);
    });

    it('should be deterministic with epsilon=0', () => {
      const context = Array(18).fill(0.5);
      const decision1 = engine.chooseAction(context);
      const decision2 = engine.chooseAction(context);
      
      expect(decision1.action).toBe(decision2.action);
    });

    it('should return score and reasoning', () => {
      const context = Array(18).fill(0.5);
      const decision = engine.chooseAction(context);
      
      expect(typeof decision.score).toBe('number');
      expect(typeof decision.reasoning).toBe('string');
    });
  });

  describe('updateWeights', () => {
    it('should increase weights for positive reward', () => {
      const context = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const weightsBefore = engine.getWeights()['nudge'][0];
      
      engine.updateWeights(context, 'nudge', 2);
      
      const weightsAfter = engine.getWeights()['nudge'][0];
      expect(weightsAfter).toBeGreaterThan(weightsBefore);
    });

    it('should decrease weights for negative reward', () => {
      const context = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const weightsBefore = engine.getWeights()['nudge'][0];
      
      engine.updateWeights(context, 'nudge', -2);
      
      const weightsAfter = engine.getWeights()['nudge'][0];
      expect(weightsAfter).toBeLessThan(weightsBefore);
    });

    it('should not affect other actions', () => {
      const context = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const celebrateBefore = engine.getWeights()['celebrate'][0];
      
      engine.updateWeights(context, 'nudge', 2);
      
      const celebrateAfter = engine.getWeights()['celebrate'][0];
      expect(celebrateAfter).toBe(celebrateBefore);
    });
  });

  describe('batchUpdate', () => {
    it('should update weights for multiple experiences', () => {
      const experiences = [
        { contextVector: Array(18).fill(0.5), action: 'nudge' as const, reward: 1 },
        { contextVector: Array(18).fill(0.3), action: 'celebrate' as const, reward: 2 },
      ];
      
      const nudgeBefore = engine.getWeights()['nudge'][0];
      const celebrateBefore = engine.getWeights()['celebrate'][0];
      
      engine.batchUpdate(experiences);
      
      const nudgeAfter = engine.getWeights()['nudge'][0];
      const celebrateAfter = engine.getWeights()['celebrate'][0];
      
      expect(nudgeAfter).not.toBe(nudgeBefore);
      expect(celebrateAfter).not.toBe(celebrateBefore);
    });
  });

  describe('convergence', () => {
    it('should converge to effective action over time', () => {
      // Simulate: 'nudge' always gets positive reward
      for (let i = 0; i < 1000; i++) {
        const context = Array(18).fill(Math.random());
        const decision = engine.chooseAction(context);
        
        // Reward: positive for nudge, negative for others
        const reward = decision.action === 'nudge' ? 2 : -1;
        engine.updateWeights(context, decision.action, reward);
      }

      // After training, should prefer nudge
      const testContext = Array(18).fill(0.5);
      const finalDecision = engine.chooseAction(testContext);
      
      expect(finalDecision.action).toBe('nudge');
    });
  });

  describe('getAllScores', () => {
    it('should return scores for all actions', () => {
      const context = Array(18).fill(0.5);
      const scores = engine.getAllScores(context);
      
      expect(Object.keys(scores).length).toBe(ACTIONS.length);
      for (const action of ACTIONS) {
        expect(typeof scores[action]).toBe('number');
      }
    });
  });

  describe('getTopActions', () => {
    it('should return top N actions sorted by score', () => {
      const context = Array(18).fill(0.5);
      const topActions = engine.getTopActions(context, 3);
      
      expect(topActions.length).toBe(3);
      expect(topActions[0].score).toBeGreaterThanOrEqual(topActions[1].score);
      expect(topActions[1].score).toBeGreaterThanOrEqual(topActions[2].score);
    });
  });

  describe('exportWeights and importWeights', () => {
    it('should export and import weights correctly', () => {
      const context = Array(18).fill(0.5);
      
      // Modify weights
      engine.updateWeights(context, 'nudge', 5);
      const exported = engine.exportWeights();
      
      // Create new engine and import
      const newEngine = new PolicyEngine({ epsilon: 0 });
      newEngine.importWeights(exported);
      
      expect(newEngine.getWeights()['nudge']).toEqual(engine.getWeights()['nudge']);
    });
  });

  describe('getStats', () => {
    it('should return valid statistics', () => {
      const stats = engine.getStats();
      
      expect(stats.totalActions).toBe(ACTIONS.length);
      expect(typeof stats.averageWeight).toBe('number');
      expect(stats.weightRange.min).toBeLessThanOrEqual(stats.weightRange.max);
    });
  });
});

describe('computeReward', () => {
  it('should return positive reward for accepted and completed', () => {
    const reward = computeReward({
      accepted: true,
      completed: true,
      metricDelta: 0.1,
      timeToAction: 60,
      explicit: null,
    });
    
    expect(reward).toBeGreaterThan(0);
  });

  it('should return negative reward for ignored', () => {
    const reward = computeReward({
      accepted: false,
      completed: false,
      metricDelta: 0,
      timeToAction: 7200,
      explicit: null,
    });
    
    expect(reward).toBeLessThan(0);
  });

  it('should be clamped between -5 and 5', () => {
    const maxReward = computeReward({
      accepted: true,
      completed: true,
      metricDelta: 10,
      timeToAction: 1,
      explicit: 'helpful',
    });
    
    expect(maxReward).toBeLessThanOrEqual(5);
    expect(maxReward).toBeGreaterThanOrEqual(-5);
  });

  it('should add bonus for explicit helpful feedback', () => {
    const withoutFeedback = computeReward({
      accepted: true,
      completed: true,
      metricDelta: 0,
      timeToAction: 60,
      explicit: null,
    });
    
    const withFeedback = computeReward({
      accepted: true,
      completed: true,
      metricDelta: 0,
      timeToAction: 60,
      explicit: 'helpful',
    });
    
    expect(withFeedback).toBeGreaterThan(withoutFeedback);
  });

  it('should penalize for explicit not_helpful feedback', () => {
    const withoutFeedback = computeReward({
      accepted: true,
      completed: false,
      metricDelta: 0,
      timeToAction: 60,
      explicit: null,
    });
    
    const withFeedback = computeReward({
      accepted: true,
      completed: false,
      metricDelta: 0,
      timeToAction: 60,
      explicit: 'not_helpful',
    });
    
    expect(withFeedback).toBeLessThan(withoutFeedback);
  });

  it('should penalize for long time to action when not accepted', () => {
    const quickIgnore = computeReward({
      accepted: false,
      completed: false,
      metricDelta: 0,
      timeToAction: 60,
      explicit: null,
    });
    
    const slowIgnore = computeReward({
      accepted: false,
      completed: false,
      metricDelta: 0,
      timeToAction: 7200, // 2 hours
      explicit: null,
    });
    
    expect(slowIgnore).toBeLessThan(quickIgnore);
  });

  it('should reward metric improvements', () => {
    const noImprovement = computeReward({
      accepted: true,
      completed: true,
      metricDelta: 0,
      timeToAction: 60,
      explicit: null,
    });
    
    const withImprovement = computeReward({
      accepted: true,
      completed: true,
      metricDelta: 0.5,
      timeToAction: 60,
      explicit: null,
    });
    
    expect(withImprovement).toBeGreaterThan(noImprovement);
  });
});
