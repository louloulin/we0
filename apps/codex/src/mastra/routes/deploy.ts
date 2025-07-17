/**
 * Deploy API Route - /api/deploy
 * 
 * Handles Netlify deployment compatible with we-dev-next
 */

import { registerApiRoute } from '@mastra/core/server';

interface DeployResponse {
  success: boolean;
  url?: string;
  message?: string;
}

/**
 * Deploy to Netlify handler
 */
async function deployHandler(c: any) {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({
        success: false,
        message: 'No file provided'
      } as DeployResponse, 400);
    }

    // Validate file type
    if (file.type !== 'application/zip') {
      return c.json({
        success: false,
        message: 'Invalid file type. Please upload a zip file'
      } as DeployResponse, 400);
    }

    // Check environment variables
    const netlifyToken = process.env.NETLIFY_TOKEN;
    const netlifyDeployUrl = process.env.NETLIFY_DEPLOY_URL;

    if (!netlifyToken || !netlifyDeployUrl) {
      return c.json({
        success: false,
        message: 'Netlify configuration missing. Please set NETLIFY_TOKEN and NETLIFY_DEPLOY_URL environment variables'
      } as DeployResponse, 500);
    }

    // Prepare deployment request
    const headers = {
      'Content-Type': 'application/zip',
      'Authorization': `Bearer ${netlifyToken}`
    };

    console.log('Deploying to Netlify...');

    // Deploy to Netlify
    const response = await fetch(netlifyDeployUrl, {
      method: 'POST',
      headers: headers,
      body: file
    });

    if (response.ok) {
      const siteInfo = await response.json();
      console.log('Site deployed successfully:', siteInfo.url);
      
      return c.json({
        success: true,
        url: siteInfo.url
      } as DeployResponse);
    } else {
      const errorText = await response.text();
      console.error(`Deployment failed. Status: ${response.status}, Response: ${errorText}`);
      
      return c.json({
        success: false,
        message: `Deployment failed with status ${response.status}`
      } as DeployResponse, response.status);
    }

  } catch (error) {
    console.error('Deploy API Error:', error);
    
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown deployment error'
    } as DeployResponse, 500);
  }
}

// Register the deploy API route
export const deployRoute = registerApiRoute('/deploy', {
  method: 'POST',
  handler: deployHandler,
  middleware: [
    // CORS middleware
    async (c, next) => {
      c.header('Access-Control-Allow-Origin', '*');
      c.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
      c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      if (c.req.method === 'OPTIONS') {
        return new Response(null, { status: 204 });
      }
      
      await next();
    },
    // Request logging
    async (c, next) => {
      const start = Date.now();
      await next();
      const duration = Date.now() - start;
      console.log(`${c.req.method} ${c.req.url} - ${duration}ms`);
    },
  ],
});

export type { DeployResponse };
