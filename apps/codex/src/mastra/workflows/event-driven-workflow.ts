/**
 * Event-Driven Workflow
 * 
 * Demonstrates event-driven workflow patterns with waitForEvent and sendEvent
 * Based on latest Mastra documentation patterns
 */

import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

/**
 * Step 1: Initialize monitoring
 */
const initializeMonitoringStep = createStep({
  id: 'initialize-monitoring',
  description: 'Initialize system monitoring and prepare for events',
  inputSchema: z.object({
    systemName: z.string().describe('Name of the system to monitor'),
    monitoringConfig: z.object({
      checkInterval: z.number().default(30).describe('Check interval in seconds'),
      thresholds: z.object({
        cpu: z.number().default(80).describe('CPU threshold percentage'),
        memory: z.number().default(85).describe('Memory threshold percentage'),
        disk: z.number().default(90).describe('Disk threshold percentage'),
      }),
      alertChannels: z.array(z.string()).default(['email', 'slack']).describe('Alert channels'),
    }),
  }),
  outputSchema: z.object({
    monitoringId: z.string().describe('Generated monitoring session ID'),
    status: z.string().describe('Monitoring status'),
    startTime: z.string().describe('Monitoring start time'),
    config: z.object({
      checkInterval: z.number(),
      thresholds: z.object({
        cpu: z.number(),
        memory: z.number(),
        disk: z.number(),
      }),
      alertChannels: z.array(z.string()),
    }),
  }),
  execute: async ({ inputData }) => {
    const { systemName, monitoringConfig } = inputData;
    
    const monitoringId = `MON-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate monitoring initialization
    console.log(`Initializing monitoring for ${systemName}...`);
    
    return {
      monitoringId,
      status: 'active',
      startTime: new Date().toISOString(),
      config: monitoringConfig,
    };
  },
});

/**
 * Step 2: Wait for system alert event
 */
const waitForAlertStep = createStep({
  id: 'wait-for-alert',
  description: 'Wait for system alert event to be triggered',
  inputSchema: z.object({
    monitoringId: z.string(),
    status: z.string(),
    startTime: z.string(),
    config: z.object({
      checkInterval: z.number(),
      thresholds: z.object({
        cpu: z.number(),
        memory: z.number(),
        disk: z.number(),
      }),
      alertChannels: z.array(z.string()),
    }),
  }),
  outputSchema: z.object({
    alertReceived: z.boolean().describe('Whether an alert was received'),
    alertType: z.string().describe('Type of alert received'),
    alertData: z.object({
      timestamp: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      metrics: z.object({
        cpu: z.number().optional(),
        memory: z.number().optional(),
        disk: z.number().optional(),
      }),
      message: z.string(),
    }).optional(),
  }),
  execute: async ({ inputData }) => {
    const { monitoringId, config } = inputData;
    
    console.log(`Monitoring ${monitoringId} is waiting for alerts...`);
    console.log(`Thresholds: CPU ${config.thresholds.cpu}%, Memory ${config.thresholds.memory}%, Disk ${config.thresholds.disk}%`);
    
    // This step will be resumed by an event
    // In a real scenario, this would be triggered by actual system monitoring
    return {
      alertReceived: false,
      alertType: 'none',
    };
  },
});

/**
 * Step 3: Process alert and determine response
 */
const processAlertStep = createStep({
  id: 'process-alert',
  description: 'Process the received alert and determine appropriate response',
  inputSchema: z.object({
    monitoringId: z.string(),
    alertReceived: z.boolean(),
    alertType: z.string(),
    alertData: z.object({
      timestamp: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      metrics: z.object({
        cpu: z.number().optional(),
        memory: z.number().optional(),
        disk: z.number().optional(),
      }),
      message: z.string(),
    }).optional(),
  }),
  outputSchema: z.object({
    responseRequired: z.boolean().describe('Whether immediate response is required'),
    responseType: z.enum(['none', 'notification', 'auto-scale', 'manual-intervention', 'emergency-shutdown']),
    actions: z.array(z.string()).describe('List of actions to take'),
    escalation: z.object({
      required: z.boolean(),
      level: z.enum(['team', 'manager', 'executive']).optional(),
      contacts: z.array(z.string()).optional(),
    }),
    recommendation: z.string().describe('Recommended course of action'),
  }),
  execute: async ({ inputData }) => {
    const { monitoringId, alertReceived, alertData } = inputData;
    
    if (!alertReceived || !alertData) {
      return {
        responseRequired: false,
        responseType: 'none' as const,
        actions: [],
        escalation: { required: false },
        recommendation: 'No alert received, continue monitoring',
      };
    }
    
    const { severity, metrics, message } = alertData;
    
    // Determine response based on severity and metrics
    let responseType: 'none' | 'notification' | 'auto-scale' | 'manual-intervention' | 'emergency-shutdown' = 'none';
    let actions: string[] = [];
    let escalation = { required: false, level: undefined as any, contacts: undefined as any };
    let recommendation = '';
    
    switch (severity) {
      case 'critical':
        responseType = 'emergency-shutdown';
        actions = [
          'Send immediate alerts to all channels',
          'Initiate emergency procedures',
          'Scale down non-essential services',
          'Prepare for manual intervention',
        ];
        escalation = {
          required: true,
          level: 'executive' as const,
          contacts: ['cto@company.com', 'ops-manager@company.com'],
        };
        recommendation = 'Immediate action required - system stability at risk';
        break;
        
      case 'high':
        responseType = 'manual-intervention';
        actions = [
          'Alert operations team',
          'Prepare scaling resources',
          'Monitor closely for degradation',
          'Ready rollback procedures',
        ];
        escalation = {
          required: true,
          level: 'manager' as const,
          contacts: ['ops-manager@company.com'],
        };
        recommendation = 'Manual intervention recommended within 15 minutes';
        break;
        
      case 'medium':
        responseType = 'auto-scale';
        actions = [
          'Trigger auto-scaling policies',
          'Notify operations team',
          'Increase monitoring frequency',
          'Log incident for review',
        ];
        escalation = {
          required: false,
          level: undefined,
          contacts: undefined,
        };
        recommendation = 'Auto-scaling should resolve the issue, monitor progress';
        break;
        
      case 'low':
        responseType = 'notification';
        actions = [
          'Log the event',
          'Send notification to team',
          'Continue normal monitoring',
        ];
        escalation = {
          required: false,
          level: undefined,
          contacts: undefined,
        };
        recommendation = 'Low priority alert, no immediate action required';
        break;
    }
    
    console.log(`Processing ${severity} alert for monitoring ${monitoringId}`);
    console.log(`Response type: ${responseType}`);
    console.log(`Actions: ${actions.join(', ')}`);
    
    return {
      responseRequired: responseType !== 'none' as any,
      responseType,
      actions,
      escalation,
      recommendation,
    };
  },
});

/**
 * Step 4: Execute response actions
 */
const executeResponseStep = createStep({
  id: 'execute-response',
  description: 'Execute the determined response actions',
  inputSchema: z.object({
    monitoringId: z.string(),
    responseRequired: z.boolean(),
    responseType: z.enum(['none', 'notification', 'auto-scale', 'manual-intervention', 'emergency-shutdown']),
    actions: z.array(z.string()),
    escalation: z.object({
      required: z.boolean(),
      level: z.enum(['team', 'manager', 'executive']).optional(),
      contacts: z.array(z.string()).optional(),
    }),
    recommendation: z.string(),
  }),
  outputSchema: z.object({
    executed: z.boolean().describe('Whether actions were executed'),
    results: z.array(z.object({
      action: z.string(),
      status: z.enum(['success', 'failed', 'pending']),
      message: z.string(),
    })).describe('Results of each action'),
    escalationSent: z.boolean().describe('Whether escalation was sent'),
    completedAt: z.string().describe('When execution completed'),
  }),
  execute: async ({ inputData }) => {
    const { monitoringId, responseRequired, actions, escalation } = inputData;
    
    if (!responseRequired) {
      return {
        executed: false,
        results: [],
        escalationSent: false,
        completedAt: new Date().toISOString(),
      };
    }
    
    // Simulate executing actions
    const results = actions.map(action => {
      // Simulate action execution with random success/failure
      const success = Math.random() > 0.1; // 90% success rate
      
      return {
        action,
        status: success ? 'success' as const : 'failed' as const,
        message: success ? `Successfully executed: ${action}` : `Failed to execute: ${action}`,
      };
    });
    
    // Handle escalation
    let escalationSent = false;
    if (escalation.required && escalation.contacts) {
      console.log(`Sending escalation to ${escalation.level}: ${escalation.contacts.join(', ')}`);
      escalationSent = true;
    }
    
    console.log(`Executed ${results.length} actions for monitoring ${monitoringId}`);
    
    return {
      executed: true,
      results,
      escalationSent,
      completedAt: new Date().toISOString(),
    };
  },
});

/**
 * Event-Driven Monitoring Workflow
 * 
 * A workflow that demonstrates:
 * - Event-driven architecture with waitForEvent
 * - System monitoring and alerting
 * - Automated response based on alert severity
 * - Escalation procedures
 */
export const eventDrivenWorkflow = createWorkflow({
  id: 'event-driven-workflow',
  description: 'Event-driven system monitoring and alerting workflow',
  inputSchema: z.object({
    systemName: z.string(),
    monitoringConfig: z.object({
      checkInterval: z.number().default(30),
      thresholds: z.object({
        cpu: z.number().default(80),
        memory: z.number().default(85),
        disk: z.number().default(90),
      }),
      alertChannels: z.array(z.string()).default(['email', 'slack']),
    }),
  }),
  outputSchema: z.object({
    executed: z.boolean(),
    results: z.array(z.object({
      action: z.string(),
      status: z.enum(['success', 'failed', 'pending']),
      message: z.string(),
    })),
    escalationSent: z.boolean(),
    completedAt: z.string(),
  }),
})
  .then(initializeMonitoringStep)
  .then(waitForAlertStep)
  .waitForEvent('system-alert', processAlertStep)
  .then(executeResponseStep)
  .commit();

/**
 * Example usage:
 * 
 * ```typescript
 * import { mastra } from '../index';
 * 
 * // Start the workflow
 * const run = await mastra.getWorkflow('event-driven-workflow').createRunAsync();
 * 
 * // Start monitoring (this will wait for events)
 * const promise = run.start({
 *   inputData: {
 *     systemName: 'production-api',
 *     monitoringConfig: {
 *       checkInterval: 30,
 *       thresholds: { cpu: 80, memory: 85, disk: 90 },
 *       alertChannels: ['email', 'slack', 'pagerduty']
 *     }
 *   }
 * });
 * 
 * // Simulate an alert event (in real scenario, this would come from monitoring system)
 * setTimeout(() => {
 *   run.sendEvent('system-alert', {
 *     timestamp: new Date().toISOString(),
 *     severity: 'high',
 *     metrics: { cpu: 95, memory: 88, disk: 45 },
 *     message: 'CPU usage exceeded threshold'
 *   });
 * }, 5000);
 * 
 * const result = await promise;
 * console.log('Workflow completed:', result);
 * ```
 */
