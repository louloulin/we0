/**
 * Approval Workflow
 * 
 * Demonstrates human-in-the-loop workflow with suspend/resume functionality
 * Based on latest Mastra documentation patterns
 */

import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

/**
 * Step 1: Prepare request for approval
 */
const prepareRequestStep = createStep({
  id: 'prepare-request',
  description: 'Prepare the request for human approval',
  inputSchema: z.object({
    requestType: z.string().describe('Type of request (e.g., deployment, code-change, feature)'),
    description: z.string().describe('Description of what needs approval'),
    priority: z.enum(['low', 'medium', 'high', 'critical']).describe('Request priority'),
    requestedBy: z.string().describe('Who is requesting the approval'),
    details: z.object({
      changes: z.array(z.string()).optional().describe('List of changes'),
      impact: z.string().optional().describe('Expected impact'),
      rollbackPlan: z.string().optional().describe('Rollback plan if needed'),
    }).optional(),
  }),
  outputSchema: z.object({
    requestId: z.string().describe('Generated request ID'),
    formattedRequest: z.string().describe('Formatted approval request'),
    approvalRequired: z.boolean().describe('Whether approval is required'),
    autoApproved: z.boolean().describe('Whether request was auto-approved'),
  }),
  execute: async ({ inputData }) => {
    const { requestType, description, priority, requestedBy, details } = inputData;
    
    // Generate unique request ID
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Check if auto-approval is possible (e.g., low priority, specific types)
    const autoApprovalCriteria = priority === 'low' && requestType === 'documentation';
    
    // Format the approval request
    const formattedRequest = `
# Approval Request: ${requestId}

**Type**: ${requestType}
**Priority**: ${priority.toUpperCase()}
**Requested by**: ${requestedBy}
**Description**: ${description}

${details ? `
## Details
${details.changes ? `**Changes**: ${details.changes.join(', ')}` : ''}
${details.impact ? `**Impact**: ${details.impact}` : ''}
${details.rollbackPlan ? `**Rollback Plan**: ${details.rollbackPlan}` : ''}
` : ''}

## Action Required
Please review and approve/reject this request.
    `.trim();

    return {
      requestId,
      formattedRequest,
      approvalRequired: !autoApprovalCriteria,
      autoApproved: autoApprovalCriteria,
    };
  },
});

/**
 * Step 2: Wait for human approval (suspendable step)
 */
const waitForApprovalStep = createStep({
  id: 'wait-for-approval',
  description: 'Wait for human approval of the request',
  inputSchema: z.object({
    requestId: z.string(),
    formattedRequest: z.string(),
    approvalRequired: z.boolean(),
    autoApproved: z.boolean(),
  }),
  outputSchema: z.object({
    approved: z.boolean().describe('Whether the request was approved'),
    approvedBy: z.string().describe('Who approved the request'),
    approvalTimestamp: z.string().describe('When the approval was given'),
    comments: z.string().optional().describe('Approval comments'),
  }),
  suspendSchema: z.object({
    requestId: z.string(),
    pendingSince: z.string(),
  }),
  resumeSchema: z.object({
    approved: z.boolean(),
    approvedBy: z.string(),
    comments: z.string().optional(),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    const { requestId, approvalRequired, autoApproved } = inputData;
    
    // If auto-approved, skip human approval
    if (autoApproved) {
      return {
        approved: true,
        approvedBy: 'system',
        approvalTimestamp: new Date().toISOString(),
        comments: 'Auto-approved based on criteria',
      };
    }
    
    // If no resume data and approval is required, suspend for human input
    if (approvalRequired && !resumeData) {
      await suspend({
        requestId,
        pendingSince: new Date().toISOString(),
      });
      
      // This return won't be reached during suspension
      return {
        approved: false,
        approvedBy: '',
        approvalTimestamp: '',
      };
    }
    
    // Process resume data from human approval
    if (resumeData) {
      return {
        approved: resumeData.approved,
        approvedBy: resumeData.approvedBy,
        approvalTimestamp: new Date().toISOString(),
        comments: resumeData.comments,
      };
    }
    
    // Fallback (should not reach here)
    return {
      approved: false,
      approvedBy: 'unknown',
      approvalTimestamp: new Date().toISOString(),
    };
  },
});

/**
 * Step 3: Process approval result
 */
const processApprovalStep = createStep({
  id: 'process-approval',
  description: 'Process the approval result and take appropriate action',
  inputSchema: z.object({
    requestId: z.string(),
    approved: z.boolean(),
    approvedBy: z.string(),
    approvalTimestamp: z.string(),
    comments: z.string().optional(),
  }),
  outputSchema: z.object({
    status: z.enum(['approved', 'rejected', 'completed']),
    message: z.string(),
    nextSteps: z.array(z.string()),
    auditLog: z.object({
      requestId: z.string(),
      finalStatus: z.string(),
      processedAt: z.string(),
      processedBy: z.string(),
    }),
  }),
  execute: async ({ inputData }) => {
    const { requestId, approved, approvedBy, approvalTimestamp, comments } = inputData;
    
    if (approved) {
      return {
        status: 'approved' as const,
        message: `Request ${requestId} has been approved by ${approvedBy}`,
        nextSteps: [
          'Proceed with implementation',
          'Monitor execution',
          'Update stakeholders',
          'Document completion',
        ],
        auditLog: {
          requestId,
          finalStatus: 'APPROVED',
          processedAt: new Date().toISOString(),
          processedBy: approvedBy,
        },
      };
    } else {
      return {
        status: 'rejected' as const,
        message: `Request ${requestId} has been rejected by ${approvedBy}`,
        nextSteps: [
          'Review rejection reasons',
          'Modify request if needed',
          'Resubmit for approval',
          'Notify stakeholders',
        ],
        auditLog: {
          requestId,
          finalStatus: 'REJECTED',
          processedAt: new Date().toISOString(),
          processedBy: approvedBy,
        },
      };
    }
  },
});

/**
 * Approval Workflow
 * 
 * A complete workflow that demonstrates:
 * - Request preparation
 * - Human-in-the-loop approval with suspend/resume
 * - Result processing and audit logging
 */
export const approvalWorkflow = createWorkflow({
  id: 'approval-workflow',
  description: 'Human-in-the-loop approval workflow with suspend/resume capabilities',
  inputSchema: z.object({
    requestType: z.string(),
    description: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    requestedBy: z.string(),
    details: z.object({
      changes: z.array(z.string()).optional(),
      impact: z.string().optional(),
      rollbackPlan: z.string().optional(),
    }).optional(),
  }),
  outputSchema: z.object({
    status: z.enum(['approved', 'rejected', 'completed']),
    message: z.string(),
    nextSteps: z.array(z.string()),
    auditLog: z.object({
      requestId: z.string(),
      finalStatus: z.string(),
      processedAt: z.string(),
      processedBy: z.string(),
    }),
  }),
})
  .then(prepareRequestStep)
  .then(waitForApprovalStep)
  .then(processApprovalStep)
  .commit();

/**
 * Example usage:
 * 
 * ```typescript
 * import { mastra } from '../index';
 * 
 * // Start the workflow
 * const run = await mastra.getWorkflow('approval-workflow').createRunAsync();
 * const result = await run.start({
 *   inputData: {
 *     requestType: 'deployment',
 *     description: 'Deploy new feature to production',
 *     priority: 'high',
 *     requestedBy: 'john.doe@company.com',
 *     details: {
 *       changes: ['Add new API endpoint', 'Update database schema'],
 *       impact: 'New feature available to users',
 *       rollbackPlan: 'Revert to previous version using blue-green deployment'
 *     }
 *   }
 * });
 * 
 * // If suspended, resume with approval
 * if (result.status === 'suspended') {
 *   const resumedResult = await run.resume({
 *     step: 'wait-for-approval',
 *     resumeData: {
 *       approved: true,
 *       approvedBy: 'manager@company.com',
 *       comments: 'Approved after review'
 *     }
 *   });
 * }
 * ```
 */
